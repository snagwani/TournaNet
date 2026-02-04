import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { AthleteDto } from './dto/athlete.dto';
import { Prisma, AthleteCategory } from '@prisma/client';

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
}
