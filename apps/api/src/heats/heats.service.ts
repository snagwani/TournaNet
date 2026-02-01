import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GenerateHeatsDto, SeedingStrategy } from './dto/generate-heats.dto';
import { HeatsResponseDto } from './dto/heats-response.dto';
import { EventType, Prisma } from '@prisma/client';

@Injectable()
export class HeatsService {
    private readonly logger = new Logger(HeatsService.name);
    // Standard Lane Preference for 8 lanes: 4, 5, 3, 6, 2, 7, 1, 8
    private readonly LANE_PREFERENCE = [4, 5, 3, 6, 2, 7, 1, 8];

    constructor(private readonly prisma: PrismaService) { }

    async generate(eventId: string, dto: GenerateHeatsDto): Promise<HeatsResponseDto> {
        return await this.prisma.$transaction(async (tx) => {
            // 1. Check if Heats already exist
            const existingHeats = await tx.heat.count({ where: { eventId } });
            if (existingHeats > 0) {
                throw new ConflictException('Heats already generated for this event');
            }

            // 2. Fetch Event
            const event = await tx.event.findUnique({ where: { id: eventId } });
            if (!event) {
                throw new NotFoundException('Event not found');
            }
            if (event.eventType !== EventType.TRACK) {
                throw new BadRequestException('Heats can only be generated for TRACK events');
            }

            const rules = event.rules as Record<string, any>;
            const maxPerHeat = rules.maxAthletesPerHeat;
            if (!maxPerHeat || typeof maxPerHeat !== 'number') {
                throw new BadRequestException('Event rules missing maxAthletesPerHeat');
            }

            // 3. Fetch Eligible Athletes
            const athletes = await tx.athlete.findMany({
                where: {
                    gender: event.gender,
                    category: event.category
                }
            });

            if (athletes.length === 0) {
                throw new BadRequestException('No eligible athletes found for this event');
            }

            // 4. Seeding Logic
            const seededAthletes = this.sortAthletes(athletes, dto.seedingStrategy || SeedingStrategy.PB_ASC);

            // 5. Generate Heats
            const heatsData = [];
            const heatAssignments = [];

            // Chunk athletes
            for (let i = 0; i < seededAthletes.length; i += maxPerHeat) {
                const chunk = seededAthletes.slice(i, i + maxPerHeat);
                const heatNumber = Math.floor(i / maxPerHeat) + 1;

                const lanesData: any[] = [];

                // Assign Lanes
                chunk.forEach((athlete, index) => {
                    // Use preference list if index < 8, else sequential from 9
                    let laneNumber = index < 8
                        ? this.LANE_PREFERENCE[index]
                        : index + 1;

                    // If chunk size is smaller than 8, we still assign preferred lanes 
                    // (e.g. 5 athletes -> 4, 5, 3, 6, 2 NOT 1,2,3,4,5).

                    lanesData.push({
                        laneNumber,
                        athleteId: athlete.id,
                        // DTO fields helper logic
                        athleteName: athlete.name,
                        bibNumber: athlete.bibNumber,
                        personalBest: athlete.personalBest
                    });
                });

                heatAssignments.push({
                    heatNumber,
                    lanes: lanesData
                });

                // Prepare Transaction Create Data
                heatsData.push({
                    eventId,
                    heatNumber,
                    lanes: {
                        create: lanesData.map(l => ({
                            laneNumber: l.laneNumber,
                            athleteId: l.athleteId
                        }))
                    }
                });
            }

            // 6. Persist Heats (Sequential creates inside transaction seems safest to map returns, 
            // but for bulk we can loop creates. Prisma createMany doesn't support nested relations easily).
            // We'll iterate.
            for (const heat of heatsData) {
                await tx.heat.create({
                    data: heat
                });
            }

            this.logger.log(`Generated ${heatAssignments.length} heats for event ${eventId}, total athletes: ${athletes.length}`);

            return new HeatsResponseDto({
                eventId,
                totalAthletes: athletes.length,
                totalHeats: heatAssignments.length,
                heats: heatAssignments
            });
        });
    }

    private sortAthletes(athletes: any[], strategy: SeedingStrategy) {
        if (strategy === SeedingStrategy.RANDOM) {
            return athletes.sort(() => Math.random() - 0.5);
        }

        // PB_ASC
        return athletes.sort((a, b) => {
            const pbA = this.parsePB(a.personalBest);
            const pbB = this.parsePB(b.personalBest);

            // If both infinity (no PB), stable sort or keep order
            if (pbA === Infinity && pbB === Infinity) return 0;
            return pbA - pbB;
        });
    }

    private parsePB(pb: string | null): number {
        if (!pb) return Infinity;
        // Simple float parse. "12.5s" -> 12.5
        const val = parseFloat(pb);
        return isNaN(val) ? Infinity : val;
    }
}
