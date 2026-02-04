import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpcomingQueryDto, ResultsQueryDto, AthleteSearchQueryDto } from './dto/scoreboard-query.dto';
import { Prisma, ResultStatus } from '@prisma/client';

@Injectable()
export class ScoreboardService {
    private readonly logger = new Logger(ScoreboardService.name);

    // Simple In-Memory Cache (TTL 30s)
    private cache = new Map<string, { data: any; expiry: number }>();
    private readonly TTL = 30 * 1000;

    constructor(private readonly prisma: PrismaService) { }

    private async getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        const now = Date.now();
        const cached = this.cache.get(key);
        if (cached && cached.expiry > now) {
            return cached.data;
        }

        const data = await fetchFn();
        this.cache.set(key, { data, expiry: now + this.TTL });
        return data;
    }

    async getCurrentEvents() {
        return this.getCached('current', async () => {
            const now = new Date();

            // Fetch events that are supposed to be happening today or in the last 12 hours
            // Using a broader fetch and filtering in memory to handle timezone safely
            const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

            const events = await this.prisma.event.findMany({
                where: {
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                },
                include: {
                    heats: {
                        include: {
                            results: {
                                include: {
                                    athlete: {
                                        include: { school: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const liveEvents = events.filter(event => {
                const start = this.combineDateTime(event.date, event.startTime);

                // If the event hasn't started yet, it's not live
                if (now < start) return false;

                // Check if all heats that have athletes/lanes have results
                // This is more robust than just checking results count
                const totalHeats = event.heats.length;
                if (totalHeats === 0) return true; // Scheduled but no heats? Assume live if time passed

                const completedHeats = event.heats.filter(h => h.results.length > 0).length;

                // If everything is done, it's not "Live" anymore, it's "Completed"
                if (completedHeats === totalHeats && totalHeats > 0) return false;

                return true;
            });

            return {
                events: liveEvents.map(e => ({
                    eventId: e.id,
                    name: e.name,
                    eventType: e.eventType,
                    category: e.category,
                    gender: e.gender,
                    status: 'ONGOING',
                    heatNumber: null,
                    liveResults: this.aggregateAndRankResults(e.heats)
                }))
            };
        });
    }

    async getUpcomingEvents(dto: UpcomingQueryDto) {
        return this.getCached(`upcoming-${dto.windowMinutes}`, async () => {
            const now = new Date();
            const windowMinutes = dto.windowMinutes ?? 120;
            const windowEnd = new Date(now.getTime() + (windowMinutes * 60000));

            // We need to fetch upcoming.
            // Prisma Query: date >= today.
            // Then filter exact times in memory for precision or use rawQuery. 
            // Memory is safer for timezone nuances if date is Date object.

            const events = await this.prisma.event.findMany({
                where: {
                    date: { gte: new Date(now.setHours(0, 0, 0, 0)) }
                },
                orderBy: [
                    { date: 'asc' },
                    { startTime: 'asc' }
                ]
            });

            const upcoming = events.filter(e => {
                const start = this.combineDateTime(e.date, e.startTime);
                const current = new Date(); // Reset now
                return start > current && start <= windowEnd;
            });

            return {
                events: upcoming.map(e => ({
                    eventId: e.id,
                    name: e.name,
                    eventType: e.eventType,
                    startTime: e.startTime,
                    venue: e.venue,
                    category: e.category,
                    gender: e.gender
                }))
            }
        });
    }

    async getResults(dto: ResultsQueryDto) {
        return this.getCached(`results-${JSON.stringify(dto)}`, async () => {
            const whereClause: Prisma.EventWhereInput = {};
            if (dto.date) {
                whereClause.date = new Date(dto.date);
            }
            if (dto.eventType) {
                whereClause.eventType = dto.eventType;
            }

            const events = await this.prisma.event.findMany({
                where: whereClause,
                include: {
                    heats: {
                        include: {
                            results: {
                                include: {
                                    athlete: {
                                        include: { school: true }
                                    }
                                },
                                orderBy: { rank: 'asc' }
                            }
                        }
                    }
                },
                orderBy: { date: 'desc' }
            });

            // An event should be shown in results if it has ANY results, 
            // even if not all heats are completed, to be more helpful.
            // But we prioritize showing completed ones.
            const withResults = events.filter(e => {
                return e.heats.some(h => h.results.length > 0);
            });

            return {
                events: withResults.map(e => ({
                    eventId: e.id,
                    name: e.name,
                    category: e.category,
                    gender: e.gender,
                    results: this.aggregateAndRankResults(e.heats)
                }))
            };
        });
    }

    /**
     * Aggregates results from multiple heats and re-ranks them if necessary.
     * This handles the "duplicate member" issue by ensuring each athlete appears only once 
     * with their best result, and correctly ranks them across all heats.
     */
    private aggregateAndRankResults(heats: any[]) {
        const athleteBestResult = new Map<string, any>();

        heats.forEach(h => {
            h.results.forEach((r: any) => {
                const existing = athleteBestResult.get(r.athleteId);
                if (!existing) {
                    athleteBestResult.set(r.athleteId, r);
                } else {
                    // If athlete appears in multiple heats (e.g. Heats and Finals), 
                    // we usually want the one with a better rank or from a later heat.
                    // For simply aggregate view, we take the one with better rank.
                    if (r.rank && (!existing.rank || r.rank < existing.rank)) {
                        athleteBestResult.set(r.athleteId, r);
                    }
                }
            });
        });

        return Array.from(athleteBestResult.values())
            .map(r => ({
                athleteId: r.athleteId,
                athleteName: r.athlete.name,
                schoolName: r.athlete.school.name,
                bibNumber: r.bibNumber,
                rank: r.rank,
                resultValue: r.resultValue,
                status: r.status
            }))
            .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }

    async getMedals() {
        return this.getCached('medals', async () => {
            // Aggregation: Fetch all Top 3 results
            const results = await this.prisma.result.findMany({
                where: {
                    rank: { in: [1, 2, 3] },
                    status: ResultStatus.FINISHED
                },
                include: {
                    athlete: {
                        include: { school: true }
                    }
                }
            });

            // Map SchoolId -> Stats
            const schoolStats = new Map<string, { schoolName: string; gold: number; silver: number; bronze: number; points: number }>();

            results.forEach(res => {
                const schoolId = res.athlete.schoolId;
                const schoolName = res.athlete.school.name;

                if (!schoolStats.has(schoolId)) {
                    schoolStats.set(schoolId, { schoolName, gold: 0, silver: 0, bronze: 0, points: 0 });
                }

                const stats = schoolStats.get(schoolId);
                // Ensure stats exists (it should, but TS is strict)
                if (stats) {
                    // Rank 1=Gold(10), 2=Silver(8), 3=Bronze(6)
                    if (res.rank === 1) {
                        stats.gold++;
                        stats.points += 10;
                    } else if (res.rank === 2) {
                        stats.silver++;
                        stats.points += 8;
                    } else if (res.rank === 3) {
                        stats.bronze++;
                        stats.points += 6;
                    }
                }
            });

            // Convert to Array & Sort
            const schools = Array.from(schoolStats.entries()).map(([id, stats]) => ({
                schoolId: id,
                ...stats
            })).sort((a, b) => {
                // Gold DESC
                if (b.gold !== a.gold) return b.gold - a.gold;
                // Silver DESC
                if (b.silver !== a.silver) return b.silver - a.silver;
                // Bronze DESC
                if (b.bronze !== a.bronze) return b.bronze - a.bronze;
                // Points DESC
                return b.points - a.points;
            });

            return {
                rankingRule: "Gold > Silver > Bronze > Total Points",
                schools
            };
        });
    }

    async searchAthletes(dto: AthleteSearchQueryDto) {
        return this.getCached(`search-${dto.q}`, async () => {
            // Handle "Bib Number" vs "Name"
            // Check if query looks like a bib number (must contain at least one hyphen to match the pattern: DISTRICT-SCHOOL-NUMBER)
            const looksLikeBib = /^[A-Z0-9]+-[A-Z0-9\-]+$/i.test(dto.q.trim());

            const whereClause: Prisma.AthleteWhereInput = looksLikeBib
                ? { bibNumber: { contains: dto.q.trim(), mode: 'insensitive' } }
                : { name: { contains: dto.q, mode: 'insensitive' } };

            const athletes = await this.prisma.athlete.findMany({
                where: whereClause,
                include: {
                    school: true,
                    results: {
                        include: {
                            heat: {
                                include: { event: true }
                            }
                        }
                    }
                },
                take: 20 // Limit results
            });

            return {
                athletes: athletes.map(a => ({
                    athleteId: a.id,
                    athleteName: a.name,
                    bibNumber: a.bibNumber,
                    schoolName: a.school.name,
                    events: a.results.map(r => ({
                        eventName: r.heat.event.name,
                        eventType: r.heat.event.eventType,
                        rank: r.rank,
                        resultValue: r.resultValue,
                        status: r.status
                    }))
                }))
            };
        });
    }

    private combineDateTime(date: Date, timeStr: string): Date {
        const [hh, mm] = timeStr.split(':').map(Number);
        // Prisma Date is at midnight UTC. We want to apply the time in the same context.
        const d = new Date(date);
        d.setUTCHours(hh, mm, 0, 0);
        // Note: If the tournament is in a specific timezone, this should be adjusted.
        // For now, using setUTCHours to match the UTC-based Date object from Prisma.
        return d;
    }
}
