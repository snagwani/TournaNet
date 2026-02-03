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
            const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

            // Fetch events for today or recent
            const events = await this.prisma.event.findMany({
                where: { date: { lte: now } }, // Rudimentary filter, logic refined below
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

            // Filter for ONGOING
            // Logic: StartTime passed AND Not fully completed.
            // Or results are coming in.
            // Simplified: If Results exist but < Heats * Lanes? 
            // Better: Return events that match the heuristics.

            const liveEvents = events.filter(event => {
                const start = this.combineDateTime(event.date, event.startTime);
                // Heursitic: Started in last 24h and not "Old"? 
                // Or just show Today's ongoing.
                if (event.date.toISOString().split('T')[0] !== todayStr) return false;

                const hasResults = event.heats.some(h => h.results.length > 0);
                const allDone = event.heats.length > 0 && event.heats.every(h => h.results.length > 0 && h.results.every(r => r.status !== null)); // Rough check

                // Status Determination
                // ONGOING if StartTime passed AND not all done.
                if (now >= start) {
                    // Check if *all* heats have results (implies completed).
                    const completedHeats = event.heats.filter(h => h.results.length > 0).length;
                    const totalHeats = event.heats.length;

                    if (totalHeats > 0 && completedHeats === totalHeats) {
                        return false; // Completed
                    }
                    return true; // Ongoing
                }
                return false; // Future
            });

            return {
                events: liveEvents.map(e => ({
                    eventId: e.id,
                    name: e.name,
                    eventType: e.eventType,
                    category: e.category,
                    gender: e.gender,
                    status: 'ONGOING',
                    heatNumber: null, // Aggregate view
                    liveResults: e.heats.flatMap(h => h.results.map(r => ({
                        athleteId: r.athleteId,
                        bibNumber: r.bibNumber,
                        athleteName: r.athlete.name,
                        schoolName: r.athlete.school.name,
                        resultValue: r.resultValue,
                        status: r.status,
                        rank: r.rank
                    }))).sort((a, b) => (a.rank || 999) - (b.rank || 999))
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
                }
            });

            const completed = events.filter(e => {
                if (e.heats.length === 0) return false;
                return e.heats.every(h => h.results.length > 0);
            });

            return {
                events: completed.map(e => ({
                    eventId: e.id,
                    name: e.name,
                    category: e.category,
                    gender: e.gender,
                    results: e.heats.flatMap(h => h.results.map(r => ({
                        athleteId: r.athleteId,
                        athleteName: r.athlete.name,
                        schoolName: r.athlete.school.name,
                        bibNumber: r.bibNumber,
                        rank: r.rank,
                        resultValue: r.resultValue,
                        status: r.status
                    }))).sort((a, b) => (a.rank || 999) - (b.rank || 999))
                }))
            };
        });
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
            // Try parsing int
            const bibSearch = parseInt(dto.q);
            const isBib = !isNaN(bibSearch);

            const whereClause: Prisma.AthleteWhereInput = isBib
                ? { bibNumber: bibSearch }
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
        const d = new Date(date);
        d.setHours(hh, mm, 0, 0);
        return d;
    }
}
