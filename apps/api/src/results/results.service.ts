import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubmitResultsDto, ResultStatus, ResultEntryDto } from './dto/submit-results.dto';
import { ResultsResponseDto, RankedResultDto } from './dto/results-response.dto';
import { EventType } from '@prisma/client';
import { Readable } from 'stream';
const csv = require('csv-parser');

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

    async bulkImport(buffer: Buffer) {
        this.logger.log('Starting bulk import of results...');

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

        const results: any[] = [];
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv({
                    separator: delimiter,
                    mapHeaders: ({ header }: { header: string }) => header.replace(/^\uFEFF/, '').replace(/"/g, '').trim().toLowerCase().replace(/ /g, '').replace(/_/g, '')
                }))
                .on('data', (data: any) => results.push(data))
                .on('end', async () => {
                    const report = { total: results.length, success: 0, failed: 0, errors: [] as string[] };
                    const clean = (val: any) => (val || '').toString().trim().replace(/^"|"$/g, '');

                    const affectedEventIds = new Set<string>();

                    for (const [index, row] of results.entries()) {
                        try {
                            const findValue = (keys: string[]) => {
                                for (const k of keys) {
                                    const match = Object.keys(row).find(rk => rk.replace(/"/g, '').toLowerCase().replace(/ /g, '').replace(/_/g, '') === k);
                                    if (match) return clean(row[match]);
                                }
                                return '';
                            };

                            const eventName = findValue(['event', 'eventname']);
                            const bibNumber = findValue(['bib', 'bibnumber', 'athletebib']);
                            const resultValue = findValue(['result', 'resultvalue', 'mark', 'time']);
                            const statusRaw = findValue(['status']).toUpperCase();
                            const notes = findValue(['notes', 'remark']);

                            if (!eventName || !bibNumber || !statusRaw) {
                                throw new Error(`Missing required fields: event, bib, status`);
                            }

                            // 1. Find Athlete
                            const athlete = await this.prisma.athlete.findUnique({
                                where: { bibNumber },
                                include: { school: true }
                            });
                            if (!athlete) throw new Error(`Athlete with Bib ${bibNumber} not found`);

                            // 2. Find Event
                            const event = await this.prisma.event.findFirst({
                                where: { name: { equals: eventName, mode: 'insensitive' } }
                            });
                            if (!event) throw new Error(`Event "${eventName}" not found`);
                            affectedEventIds.add(event.id);

                            // 3. Find Heat for this athlete in this event
                            const heat = await this.prisma.heat.findFirst({
                                where: {
                                    eventId: event.id,
                                    lanes: { some: { athleteId: athlete.id } }
                                }
                            });
                            if (!heat) throw new Error(`Athlete ${athlete.name} is not assigned to any heat for event "${eventName}"`);

                            // 4. Upsert Result
                            const status = statusRaw as any; // Cast to ResultStatus

                            await this.prisma.result.upsert({
                                where: {
                                    heatId_athleteId: {
                                        athleteId: athlete.id,
                                        heatId: heat.id
                                    }
                                },
                                update: {
                                    status,
                                    resultValue: resultValue || null,
                                    notes: notes || null
                                },
                                create: {
                                    athleteId: athlete.id,
                                    heatId: heat.id,
                                    bibNumber: athlete.bibNumber,
                                    status,
                                    resultValue: resultValue || null,
                                    notes: notes || null
                                }
                            });

                            report.success++;
                        } catch (err: any) {
                            const keys = Object.keys(row).join(',');
                            this.logger.error(`Result row ${index + 1} failed: ${err.message}`);
                            report.failed++;
                            report.errors.push(`Row ${index + 1}: ${err.message} (Columns: ${keys})`);
                        }
                    }

                    // 5. Re-calculate ranks for events we touched
                    for (const eventId of affectedEventIds) {
                        try {
                            const event = await this.prisma.event.findUnique({
                                where: { id: eventId },
                                include: { heats: { include: { results: true } } }
                            });
                            if (!event) continue;

                            for (const heat of event.heats) {
                                const resEntries = heat.results.map(r => ({
                                    athleteId: r.athleteId,
                                    bibNumber: r.bibNumber,
                                    status: r.status,
                                    resultValue: r.resultValue,
                                    notes: r.notes
                                }));
                                const ranked = this.calculateRanks(resEntries as any, event.eventType);

                                for (const r of ranked) {
                                    await this.prisma.result.update({
                                        where: { heatId_athleteId: { heatId: heat.id, athleteId: r.athleteId } },
                                        data: { rank: r.rank }
                                    });
                                }
                            }
                        } catch (err: any) {
                            this.logger.error(`Failed to re-calculate ranks for event ${eventId}: ${err.message}`);
                        }
                    }

                    this.logger.log(`Bulk results import complete. Success: ${report.success}, Failed: ${report.failed}`);
                    resolve(report);
                })
                .on('error', (err: Error) => reject(err));
        });
    }

    private parseValue(val: string | null): number {
        if (!val) return 0;
        // Strip non-numeric chars (like 's' or 'm') just in case, though validator allows strings.
        // "10.5s" -> 10.5
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
    }
}
