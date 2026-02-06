import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SchoolDto } from './dto/school.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolsService {
    private readonly logger = new Logger(SchoolsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(createSchoolDto: CreateSchoolDto, file?: Express.Multer.File): Promise<SchoolDto> {
        this.logger.log(`Creating new school: ${createSchoolDto.name} (${createSchoolDto.district})`);

        let logoUrl: string | undefined;

        if (file) {
            // In a real app, upload to S3 here. For now, we use the local path managed by Multer (if diskStorage) 
            // or write the buffer to disk if memoryStorage (default).
            // Since we didn't configure Multer options in Controller, it uses MemoryStorage by default.
            // We need to write the buffer to disk manually or configure Multer in Controller.
            // Let's write manually for simplicity in Service for now, ensuring unique name.

            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');

            // Ensure directory exists (async check/create if needed, but we essentially did mkdir -p)
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = `school-logo-${uniqueSuffix}${ext}`;
            const filepath = path.join(uploadDir, filename);

            fs.writeFileSync(filepath, file.buffer);
            logoUrl = `/uploads/${filename}`;
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const school = await tx.school.create({
                    data: {
                        name: createSchoolDto.name,
                        district: createSchoolDto.district,
                        contactName: createSchoolDto.contactName,
                        contactEmail: createSchoolDto.contactEmail,
                        contactPhone: createSchoolDto.contactPhone ?? null,
                        logoUrl: logoUrl ?? null,
                        shortCode: createSchoolDto.shortCode.toUpperCase(),
                    },
                });

                this.logger.log(`School created successfully: ${school.id}`);

                return new SchoolDto(school);
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    this.logger.warn(`Failed to create school: Duplicate name+district combination. Data: ${JSON.stringify(createSchoolDto)}`);
                    throw new BadRequestException('School with this name already exists in this district');
                }
            }

            this.logger.error(`Error creating school: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Failed to create school');
        }
    }

    async bulkImport(buffer: Buffer) {
        this.logger.log('Starting bulk import of schools...');

        // Detect delimiter
        const contentPreview = buffer.toString('utf-8', 0, 2048);
        const headerLine = contentPreview.split(/[\r\n]+/)[0];
        const counts = {
            ',': (headerLine.match(/,/g) || []).length,
            ';': (headerLine.match(/;/g) || []).length,
            '\t': (headerLine.match(/\t/g) || []).length
        };
        let delimiter = ',';
        if (counts[';'] > counts[',']) delimiter = ';';
        if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) delimiter = '\t';

        this.logger.log(`School import info: Line1: [${headerLine}] Delimiter: "${delimiter === '\t' ? '\\t' : delimiter}"`);

        const results: any[] = [];
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv({
                    separator: delimiter,
                    mapHeaders: ({ header }) => {
                        return header
                            .replace(/^\uFEFF/, '')
                            .replace(/"/g, '')
                            .trim()
                            .toLowerCase()
                            .replace(/ /g, '')
                            .replace(/_/g, '');
                    }
                }))
                .on('data', (data: any) => {
                    results.push(data);
                })
                .on('end', async () => {
                    this.logger.log(`Finished parsing CSV. Total rows found: ${results.length}`);
                    const report = {
                        total: results.length,
                        success: 0,
                        failed: 0,
                        errors: [] as string[]
                    };

                    const clean = (val: any) => (val || '').toString().trim().replace(/^"|"$/g, '');

                    for (const [index, row] of results.entries()) {
                        try {
                            const findValue = (searchKeys: string[]) => {
                                for (const searchKey of searchKeys) {
                                    const foundKey = Object.keys(row).find(k => {
                                        const cleanK = k.replace(/"/g, '').toLowerCase().replace(/ /g, '').replace(/_/g, '');
                                        return searchKey === cleanK;
                                    });
                                    if (foundKey) return clean(row[foundKey]);
                                }
                                return '';
                            };

                            const name = findValue(['name', 'schoolname', 'school']);
                            const district = findValue(['district', 'city', 'location']);
                            const shortCode = findValue(['shortcode', 'code', 'acronym']);
                            const contactName = findValue(['contactname', 'principal', 'head', 'contact']);
                            const contactEmail = findValue(['contactemail', 'email', 'emailaddress']);
                            const contactPhone = findValue(['contactphone', 'phone', 'phonenumber']) || undefined;

                            this.logger.log(`Processing school row ${index + 1}: ${name || 'Unknown'}`);

                            // Basic validation
                            if (!name || !district || !shortCode || !contactName || !contactEmail) {
                                const missing = [];
                                if (!name) missing.push('name');
                                if (!district) missing.push('district');
                                if (!shortCode) missing.push('shortCode');
                                if (!contactName) missing.push('contactName');
                                if (!contactEmail) missing.push('contactEmail');
                                throw new Error(`Missing required fields: ${missing.join(', ')}`);
                            }

                            const schoolData = {
                                name,
                                district,
                                shortCode: shortCode.toUpperCase(),
                                contactName,
                                contactEmail,
                                contactPhone: contactPhone || null,
                            };

                            // Upsert logic: find existing by name + district (the unique constraint)
                            const existing = await this.prisma.school.findFirst({
                                where: { name, district }
                            });

                            if (existing) {
                                await this.prisma.school.update({
                                    where: { id: existing.id },
                                    data: schoolData
                                });
                            } else {
                                await this.prisma.school.create({
                                    data: schoolData
                                });
                            }
                            report.success++;
                        } catch (err: any) {
                            const keys = Object.keys(row).join(', ');
                            this.logger.error(`Row ${index + 1} failed: ${err.message}. Row keys: ${keys}`);
                            report.failed++;
                            report.errors.push(`Row ${index + 1} (${row.name || row.schoolname || 'Unknown'}): ${err.message} (Found columns: ${keys})`);
                        }
                    }
                    this.logger.log(`Bulk import complete. Success: ${report.success}, Failed: ${report.failed}`);
                    resolve(report);
                })
                .on('error', (err: any) => {
                    this.logger.error(`CSV Parsing stream error: ${err.message}`);
                    reject(new InternalServerErrorException('CSV parsing failed'));
                });
        });
    }
}
