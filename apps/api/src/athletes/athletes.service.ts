import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { AthleteDto } from './dto/athlete.dto';
import { Prisma, AthleteCategory, Gender } from '@prisma/client';

@Injectable()
export class AthletesService {
    private readonly logger = new Logger(AthletesService.name);

    // Business Rules: Age Range per Category
    private readonly AGE_RULES: Record<AthleteCategory, { min: number; max: number }> = {
        [AthleteCategory.U14]: { min: 10, max: 13 },
        [AthleteCategory.U17]: { min: 14, max: 16 },
        [AthleteCategory.U19]: { min: 17, max: 19 },
    };

    constructor(private readonly prisma: PrismaService) { }

    async create(createAthleteDto: CreateAthleteDto): Promise<AthleteDto> {
        this.logger.log(`Creating athlete: ${createAthleteDto.name} (${createAthleteDto.category})`);

        // 1. Validate Age-Category Mapping
        const rules = this.AGE_RULES[createAthleteDto.category];
        if (createAthleteDto.age < rules.min || createAthleteDto.age > rules.max) {
            this.logger.warn(`Age mismatch: ${createAthleteDto.age} not valid for ${createAthleteDto.category}`);
            throw new BadRequestException(
                `Age ${createAthleteDto.age} does not match category ${createAthleteDto.category} (requires ${rules.min}-${rules.max})`
            );
        }

        // 2. Validate School Exists and get codes for Bib
        const school = await this.prisma.school.findUnique({
            where: { id: createAthleteDto.schoolId },
            select: { id: true, district: true, shortCode: true }
        });
        if (!school) {
            this.logger.warn(`School not found: ${createAthleteDto.schoolId}`);
            throw new BadRequestException('School not found');
        }

        // 3. Generate Bib Number (Format: DIST-SCHOOL-001)
        // Get count of athletes in this school to generate sequence
        const schoolAthleteCount = await this.prisma.athlete.count({
            where: { schoolId: createAthleteDto.schoolId }
        });
        const distCode = school.district.substring(0, 3).toUpperCase();
        const schoolCode = school.shortCode.toUpperCase();
        const sequence = (schoolAthleteCount + 1).toString().padStart(3, '0');
        const bibNumber = `${distCode}-${schoolCode}-${sequence}`;

        // 4. Validate Event Limit (Max 3)
        if (createAthleteDto.eventIds && createAthleteDto.eventIds.length > 3) {
            throw new BadRequestException('An athlete can register for maximum 3 events');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Check if events match athlete gender and category
                if (createAthleteDto.eventIds && createAthleteDto.eventIds.length > 0) {
                    const events = await tx.event.findMany({
                        where: { id: { in: createAthleteDto.eventIds } },
                        select: { gender: true, category: true, id: true }
                    });

                    if (events.length !== createAthleteDto.eventIds.length) {
                        throw new BadRequestException('One or more selected events do not exist');
                    }

                    for (const event of events) {
                        if (event.gender !== createAthleteDto.gender || event.category !== createAthleteDto.category) {
                            throw new BadRequestException(`Athlete gender/category does not match event ${event.id}`);
                        }
                    }
                }

                const athlete = await tx.athlete.create({
                    data: {
                        name: createAthleteDto.name,
                        age: createAthleteDto.age,
                        gender: createAthleteDto.gender,
                        category: createAthleteDto.category,
                        schoolId: createAthleteDto.schoolId,
                        personalBest: createAthleteDto.personalBest,
                        bibNumber,
                        registrations: {
                            create: (createAthleteDto.eventIds || []).map(eventId => ({
                                eventId
                            }))
                        }
                    },
                });

                this.logger.log(`Athlete created: ${athlete.id}, Bib: ${athlete.bibNumber}`);
                return new AthleteDto(athlete);
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // Duplicate constraint violation (name + age + schoolId)
                if (error.code === 'P2002') {
                    // Log the exact fields that caused the duplicate
                    const fields = (error.meta?.target as string[]) || [];
                    this.logger.warn(`Duplicate athlete detected on fields: [${fields.join(', ')}]. Values: name="${createAthleteDto.name}", age=${createAthleteDto.age}, schoolId="${createAthleteDto.schoolId}"`);
                    throw new BadRequestException('Athlete with this name and age already registered for this school');
                }
            }

            this.logger.error(`Failed to create athlete: ${error instanceof Error ? error.message : 'Unknown'}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Failed to create athlete');
        }
    }

    async bulkImport(buffer: Buffer) {
        this.logger.log('Starting bulk import of athletes...');

        // Detect encoding/BOM and get start of file
        const contentPreview = buffer.toString('utf-8', 0, 2048);
        const headerLine = contentPreview.split(/[\r\n]+/)[0];

        // Smarter delimiter detection: count occurrences of , ; \t
        const counts = {
            ',': (headerLine.match(/,/g) || []).length,
            ';': (headerLine.match(/;/g) || []).length,
            '\t': (headerLine.match(/\t/g) || []).length
        };

        let delimiter = ',';
        if (counts[';'] > counts[',']) delimiter = ';';
        if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) delimiter = '\t';

        this.logger.log(`Athlete import info: Line1: [${headerLine}] Delimiter: "${delimiter === '\t' ? '\\t' : delimiter}"`);

        const results: any[] = [];
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv({
                    separator: delimiter,
                    mapHeaders: ({ header }) => {
                        // Strip BOM, ALL quotes, and normalize
                        const normalized = header
                            .replace(/^\uFEFF/, '')
                            .replace(/"/g, '') // Remove all quotes
                            .trim()
                            .toLowerCase()
                            .replace(/ /g, '')
                            .replace(/_/g, '');
                        return normalized;
                    }
                }))
                .on('data', (data: any) => {
                    results.push(data);
                })
                .on('end', async () => {
                    this.logger.log(`CSV parsing complete. Found ${results.length} rows.`);
                    const report = {
                        total: results.length,
                        success: 0,
                        failed: 0,
                        errors: [] as string[]
                    };

                    const clean = (val: any) => (val || '').toString().trim().replace(/^"|"$/g, '');

                    for (const [index, row] of results.entries()) {
                        let currentName = 'Unknown';
                        try {
                            // Priority-based mapping - check keys in the order provided
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

                            const name = findValue(['name', 'athletename', 'fullname', 'athlete', 'participant']);
                            const gender = findValue(['gender', 'sex']).toUpperCase() as Gender;
                            const category = findValue(['category', 'division', 'agegroup']).toUpperCase() as AthleteCategory;
                            const ageRaw = findValue(['age', 'athleteage', 'years']);
                            const age = parseInt(ageRaw);
                            const schoolId = findValue(['schoolid', 'schooluuid', 'schoolcode', 'school']);
                            const personalBest = findValue(['personalbest', 'pb', 'besttime', 'mark']) || undefined;

                            currentName = name || `Row ${index + 1}`;

                            // Check for empty row
                            if (Object.values(row).every(v => clean(v) === '')) {
                                report.total--; // Don't count empty rows toward total
                                continue;
                            }

                            // Basic validation
                            if (!name || !gender || !category || !age || !schoolId) {
                                const missing = [];
                                if (!name) missing.push('name');
                                if (!gender) missing.push('gender');
                                if (!category) missing.push('category');
                                if (!ageRaw) missing.push('age');
                                if (!schoolId) missing.push('schoolId');
                                throw new Error(`Missing required fields: ${missing.join(', ')}`);
                            }

                            // Resolve schoolId: Try provided ID first, fallback to Name lookup
                            let resolvedSchoolId = schoolId;
                            const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolId);

                            const schoolExists = looksLikeUuid ? await this.prisma.school.findUnique({ where: { id: schoolId } }) : null;

                            if (!schoolExists) {
                                // Try lookup by name (case-insensitive)
                                const schoolByName = await this.prisma.school.findFirst({
                                    where: { name: { equals: schoolId, mode: 'insensitive' } }
                                });
                                if (schoolByName) {
                                    resolvedSchoolId = schoolByName.id;
                                    this.logger.debug(`Resolved school "${schoolId}" to ID: ${resolvedSchoolId}`);
                                } else {
                                    throw new Error(`School not found: "${schoolId}". Please ensure the school is registered first.`);
                                }
                            }

                            // Upsert logic: find existing by name + school
                            const existing = await this.prisma.athlete.findFirst({
                                where: {
                                    name: { equals: name, mode: 'insensitive' },
                                    schoolId: resolvedSchoolId
                                }
                            });

                            if (existing) {
                                await this.prisma.athlete.update({
                                    where: { id: existing.id },
                                    data: {
                                        age,
                                        gender,
                                        category,
                                        personalBest: personalBest ?? null,
                                    }
                                });
                            } else {
                                const createDto: CreateAthleteDto = {
                                    name,
                                    age,
                                    gender,
                                    category,
                                    schoolId: resolvedSchoolId,
                                    personalBest
                                };
                                await this.create(createDto);
                            }
                            report.success++;
                        } catch (err: any) {
                            const keys = Object.keys(row).join(', ');
                            this.logger.error(`Athlete row ${index + 1} failed: ${err.message}. Row keys: ${keys}`);
                            report.failed++;
                            report.errors.push(`Row ${index + 1} (${currentName}): ${err.message} (Found columns: ${keys})`);
                        }
                    }
                    this.logger.log(`Bulk athlete import complete. Success: ${report.success}, Failed: ${report.failed}`);
                    resolve(report);
                })
                .on('error', (err: any) => {
                    this.logger.error(`Athlete CSV stream error: ${err.message}`);
                    reject(new InternalServerErrorException('CSV parsing failed'));
                });
        });
    }
}
