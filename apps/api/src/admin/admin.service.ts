import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AthleteReportQueryDto, EventReportQueryDto, ExportQueryDto } from './dto/admin-query.dto';
import { AthleteCategory, Gender, ResultStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getSystemOverview() {
        const [totalSchools, totalAthletes, totalEvents, completedEvents] = await Promise.all([
            this.prisma.school.count(),
            this.prisma.athlete.count(),
            this.prisma.event.count(),
            this.prisma.event.count({
                where: {
                    heats: {
                        some: {
                            results: {
                                some: {} // Has at least one result
                            }
                        }
                    }
                }
            })
        ]);

        const eventsRemaining = totalEvents - completedEvents;

        // Medal count: Ranks 1, 2, 3
        const medalsDistributed = await this.prisma.result.count({
            where: {
                rank: { in: [1, 2, 3] },
                status: ResultStatus.FINISHED
            }
        });

        return {
            totalSchools,
            totalAthletes,
            totalEvents,
            eventsCompleted: completedEvents,
            eventsRemaining: Math.max(0, eventsRemaining),
            medalsDistributed,
            lastUpdated: new Date().toISOString()
        };
    }

    async getSchoolReports() {
        // Fetch stats via deep aggregation
        const schoolsWithData = await this.prisma.school.findMany({
            include: {
                athletes: {
                    include: {
                        results: {
                            select: {
                                rank: true,
                                status: true,
                                heat: {
                                    select: {
                                        eventId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const mapped = schoolsWithData.map(s => {
            let gold = 0, silver = 0, bronze = 0, points = 0;
            const eventIds = new Set<string>();

            s.athletes.forEach(a => {
                a.results.forEach(r => {
                    // eventId is available via heat.eventId because it's selected above
                    if (r.heat) {
                        eventIds.add(r.heat.eventId);
                    }
                    if (r.status === ResultStatus.FINISHED) {
                        if (r.rank === 1) { gold++; points += 10; }
                        else if (r.rank === 2) { silver++; points += 8; }
                        else if (r.rank === 3) { bronze++; points += 6; }
                    }
                });
            });

            return {
                schoolId: s.id,
                schoolName: s.name,
                district: s.district,
                athletesCount: s.athletes.length,
                eventsParticipated: eventIds.size,
                gold,
                silver,
                bronze,
                totalPoints: points
            };
        });

        return {
            schools: mapped.sort((a, b) => {
                if (b.gold !== a.gold) return b.gold - a.gold;
                if (b.silver !== a.silver) return b.silver - a.silver;
                if (b.bronze !== a.bronze) return b.bronze - a.bronze;
                return b.totalPoints - a.totalPoints;
            })
        };
    }

    async getSchoolDetail(id: string) {
        const school = await this.prisma.school.findUnique({
            where: { id },
            include: {
                athletes: {
                    include: {
                        results: {
                            include: {
                                heat: {
                                    include: {
                                        event: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!school) return null;

        let gold = 0, silver = 0, bronze = 0, points = 0;
        const eventsParticipated = new Set<string>();

        const athletes = school.athletes.map(a => {
            let athleteGold = 0, athleteSilver = 0, athleteBronze = 0;
            const athleteEvents = a.results.map(r => {
                if (r.heat) {
                    eventsParticipated.add(r.heat.eventId);
                }
                if (r.status === ResultStatus.FINISHED) {
                    if (r.rank === 1) { gold++; athleteGold++; points += 10; }
                    else if (r.rank === 2) { silver++; athleteSilver++; points += 8; }
                    else if (r.rank === 3) { bronze++; athleteBronze++; points += 6; }
                }
                return {
                    eventName: r.heat.event.name,
                    eventType: r.heat.event.eventType,
                    rank: r.rank,
                    resultValue: r.resultValue,
                    status: r.status
                };
            });

            return {
                athleteId: a.id,
                name: a.name,
                bibNumber: a.bibNumber,
                category: a.category,
                gender: a.gender,
                gold: athleteGold,
                silver: athleteSilver,
                bronze: athleteBronze,
                events: athleteEvents
            };
        });

        return {
            schoolId: school.id,
            schoolName: school.name,
            district: school.district,
            athletesCount: school.athletes.length,
            eventsParticipated: eventsParticipated.size,
            gold,
            silver,
            bronze,
            totalPoints: points,
            athletes
        };
    }

    async getAthleteReports(query: AthleteReportQueryDto) {
        const where: Prisma.AthleteWhereInput = {};
        if (query.schoolId) where.schoolId = query.schoolId;
        if (query.category) where.category = query.category as AthleteCategory;
        if (query.gender) where.gender = query.gender;

        const athletes = await this.prisma.athlete.findMany({
            where,
            include: {
                school: true,
                results: {
                    include: {
                        heat: {
                            include: {
                                event: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        return {
            athletes: athletes.map(a => ({
                athleteId: a.id,
                athleteName: a.name,
                bibNumber: a.bibNumber,
                schoolName: a.school.name,
                category: a.category,
                gender: a.gender,
                eventsCount: a.results.length,
                events: a.results.map(r => ({
                    eventName: r.heat.event.name,
                    eventType: r.heat.event.eventType,
                    rank: r.rank,
                    resultValue: r.resultValue,
                    status: r.status
                }))
            }))
        };
    }

    async getAthleteDetail(id: string) {
        const athlete = await this.prisma.athlete.findUnique({
            where: { id },
            include: {
                school: true,
                results: {
                    include: {
                        heat: {
                            include: {
                                event: true
                            }
                        }
                    },
                    orderBy: {
                        heat: {
                            event: {
                                date: 'desc'
                            }
                        }
                    }
                }
            }
        });

        if (!athlete) return null;

        return {
            athleteId: athlete.id,
            athleteName: athlete.name,
            bibNumber: athlete.bibNumber,
            schoolName: athlete.school.name,
            category: athlete.category,
            gender: athlete.gender,
            personalBest: athlete.personalBest,
            events: athlete.results.map(r => ({
                eventId: r.heat.eventId,
                eventName: r.heat.event.name,
                eventType: r.heat.event.eventType,
                date: r.heat.event.date,
                rank: r.rank,
                resultValue: r.resultValue,
                status: r.status,
                notes: r.notes
            }))
        };
    }

    async getEventReports(query: EventReportQueryDto) {
        const { eventType, category, gender, sortBy, sortOrder } = query;

        const where: Prisma.EventWhereInput = {
            eventType: eventType || undefined,
            category: category as any || undefined,
            gender: gender as any || undefined,
        };

        const orderBy: any[] = [];
        if (sortBy === 'name') {
            orderBy.push({ name: sortOrder || 'asc' });
        } else if (sortBy === 'date') {
            orderBy.push({ date: sortOrder || 'asc' });
            orderBy.push({ startTime: sortOrder || 'asc' });
        } else {
            orderBy.push({ date: 'asc' });
            orderBy.push({ startTime: 'asc' });
        }

        const events = await this.prisma.event.findMany({
            where,
            include: {
                heats: {
                    include: {
                        results: {
                            include: {
                                athlete: {
                                    include: {
                                        school: true
                                    }
                                }
                            },
                            orderBy: {
                                rank: 'asc'
                            }
                        }
                    }
                }
            },
            orderBy
        });

        return {
            events: events.map(e => this.formatEventReport(e))
        };
    }

    async getEventDetail(id: string) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                heats: {
                    include: {
                        results: {
                            include: {
                                athlete: {
                                    include: {
                                        school: true
                                    }
                                }
                            },
                            orderBy: {
                                rank: 'asc'
                            }
                        }
                    }
                }
            }
        });

        if (!event) return null;

        return this.formatEventReport(event);
    }

    private formatEventReport(e: any) {
        // Combine all results from all heats
        const allResults = e.heats.flatMap((h: any) => h.results);

        // Sort by rank, then filter finished for medalists
        const sorted = [...allResults].sort((a: any, b: any) => (a.rank || 999) - (b.rank || 999));

        const getMedalist = (r: number) => {
            const match = sorted.find((res: any) => res.rank === r && res.status === ResultStatus.FINISHED);
            return match ? {
                athleteName: match.athlete.name,
                schoolName: match.athlete.school.name
            } : null;
        };

        return {
            eventId: e.id,
            eventName: e.name,
            eventType: e.eventType,
            category: e.category,
            gender: e.gender,
            date: e.date,
            gold: getMedalist(1),
            silver: getMedalist(2),
            bronze: getMedalist(3),
            results: sorted.map((r: any) => ({
                athleteId: r.athleteId,
                athleteName: r.athlete.name,
                schoolName: r.athlete.school.name,
                bibNumber: r.bibNumber,
                status: r.status,
                resultValue: r.resultValue,
                rank: r.rank,
                notes: r.notes
            }))
        };
    }

    async exportReport(query: ExportQueryDto) {
        throw new NotImplementedException(`Export for ${query.type} in ${query.format} is not yet implemented.`);
    }
}
