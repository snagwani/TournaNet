import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubmitResultsDto, ResultStatus, ResultEntryDto } from './dto/submit-results.dto';
import { ResultsResponseDto, RankedResultDto } from './dto/results-response.dto';
import { EventType } from '@prisma/client';

@Injectable()
export class ResultsService {
    private readonly logger = new Logger(ResultsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async submitResults(eventId: string, heatId: string, dto: SubmitResultsDto): Promise<ResultsResponseDto> {
        return await this.prisma.$transaction(async (tx) => {
            // 1. Idempotency Check
            const existingCount = await tx.result.count({ where: { heatId } });
            if (existingCount > 0) {
                throw new ConflictException('Results already submitted for this heat');
            }

            // 2. Fetch Heat & Event (for ranking rules)
            const heat = await tx.heat.findUnique({
                where: { id: heatId },
                include: { event: true } // Determine Track vs Field
            });

            if (!heat) {
                throw new NotFoundException('Heat not found');
            }
            if (heat.eventId !== eventId) {
                throw new BadRequestException('Heat does not belong to the specified event');
            }

            // 3. Validation Logic (Strict Status Rules)
            for (const res of dto.results) {
                if (res.status === ResultStatus.FINISHED) {
                    if (!res.resultValue) {
                        throw new BadRequestException(`Finished athlete ${res.bibNumber} must have a result value`);
                    }
                } else {
                    // DNS, DNF, DQ
                    if (res.resultValue) {
                        throw new BadRequestException(`Athlete ${res.bibNumber} with status ${res.status} cannot have a result value`);
                    }
                }
            }

            // 4. Ranking Logic
            const rankedResults = this.calculateRanks(dto.results, heat.event.eventType);

            // 5. Build Summary
            const summary = {
                totalAthletes: dto.results.length,
                finishedCount: dto.results.filter(r => r.status === ResultStatus.FINISHED).length,
                dnsCount: dto.results.filter(r => r.status === ResultStatus.DNS).length,
                dnfCount: dto.results.filter(r => r.status === ResultStatus.DNF).length,
                dqCount: dto.results.filter(r => r.status === ResultStatus.DQ).length
            };

            // 6. Persistence
            // We create results one by one or createMany. createMany is cleaner but we need to map input to Prisma model.
            // Map DTO to Prisma Input
            const createData = rankedResults.map(r => ({
                heatId,
                athleteId: r.athleteId,
                bibNumber: r.bibNumber,
                status: r.status as any, // Cast to Prisma Enum
                resultValue: r.resultValue,
                rank: r.rank,
                notes: r.notes
            }));

            await tx.result.createMany({
                data: createData
            });

            this.logger.log(`Results submitted for Heat ${heatId}: ${summary.finishedCount} Finished`);

            // Return formatted response
            // We need to re-map createData + qualified logic (mocked to false for now)
            const responseResults: RankedResultDto[] = rankedResults.map(r => ({
                ...r,
                qualified: false // Logic for qualification not implemented yet
            }));

            // Plain object return for serialization
            return {
                eventId,
                heatId,
                summary,
                results: responseResults
            };
        });
    }

    private calculateRanks(results: ResultEntryDto[], eventType: 'TRACK' | 'FIELD'): RankedResultDto[] {
        // Separate Finished vs Others
        const finished = results.filter(r => r.status === ResultStatus.FINISHED);
        const others = results.filter(r => r.status !== ResultStatus.FINISHED);

        // Sort Finished
        finished.sort((a, b) => {
            const valA = this.parseValue(a.resultValue);
            const valB = this.parseValue(b.resultValue);

            if (eventType === 'TRACK') {
                return valA - valB; // Ascending (Lower is better)
            } else {
                return valB - valA; // Descending (Higher is better)
            }
        });

        // Assign Ranks (Check Ties)
        let currentRank = 1;
        const rankedFinished = finished.map((res, index) => {
            // Check tie with previous
            if (index > 0) {
                const prevRes = finished[index - 1];
                const prevVal = this.parseValue(prevRes.resultValue);
                const currVal = this.parseValue(res.resultValue);

                // If value is effectively equal (with small epsilon just in case, but string compare is safer if consistent formatting)
                // We'll use numeric compare.
                if (Math.abs(currVal - prevVal) < 0.0001) {
                    // Tie: Keep same rank as previous
                    // rank doesn't increment.
                } else {
                    currentRank = index + 1;
                }
            } else {
                currentRank = 1;
            }

            return {
                ...res,
                rank: currentRank,
                qualified: false,
                notes: res.notes || null
            };
        });

        // Others have null rank
        const mappedOthers = others.map(res => ({
            ...res,
            rank: null,
            qualified: false,
            notes: res.notes || null,
            resultValue: null // Ensure null in output
        }));

        return [...rankedFinished, ...mappedOthers];
    }

    private parseValue(val: string | null): number {
        if (!val) return 0;
        // Strip non-numeric chars (like 's' or 'm') just in case, though validator allows strings.
        // "10.5s" -> 10.5
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
    }
}
