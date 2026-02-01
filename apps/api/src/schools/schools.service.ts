import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SchoolDto } from './dto/school.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolsService {
    private readonly logger = new Logger(SchoolsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(createSchoolDto: CreateSchoolDto): Promise<SchoolDto> {
        this.logger.log(`Creating new school: ${createSchoolDto.name} (${createSchoolDto.district})`);

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Check for existing school with same name + district (enforced by DB, but good to check explicitly or catch error)
                // We'll rely on Prisma error code P2002 for unique constraint violation handling in the catch block 
                // to minimize race conditions, but logically:

                const school = await tx.school.create({
                    data: {
                        name: createSchoolDto.name,
                        district: createSchoolDto.district,
                        contactName: createSchoolDto.contactName,
                        contactEmail: createSchoolDto.contactEmail,
                        contactPhone: createSchoolDto.contactPhone ?? null, // handle optional undefined as null if needed or Prisma handles undefined as null for nullable fields? Prisma handles missing optional fields as null if default? No, explicit null is safer.
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
