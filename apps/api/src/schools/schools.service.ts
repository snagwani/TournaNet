import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
}
