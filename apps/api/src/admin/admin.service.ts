import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AthleteReportQueryDto, EventReportQueryDto, ExportQueryDto } from './dto/admin-query.dto';
import { AthleteCategory, Gender, ResultStatus, Prisma, EventType } from '@prisma/client';

const { Parser } = require('json2csv');
const BOM = '\uFEFF';

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
                // Group by eventId to ensure we only count one medal per athlete per event (best result)
                const bestResultsPerEvent = new Map<string, { rank: number | null, status: ResultStatus }>();

                a.results.forEach(r => {
                    if (r.heat) {
                        eventIds.add(r.heat.eventId);

                        const current = bestResultsPerEvent.get(r.heat.eventId);
                        const isBetter = !current || (r.rank !== null && (current.rank === null || r.rank < current.rank));

                        // We prioritize FINISHED status and lower ranks
                        if (r.status === ResultStatus.FINISHED) {
                            if (!current || current.status !== ResultStatus.FINISHED || (r.rank !== null && (current.rank === null || r.rank < current.rank))) {
                                bestResultsPerEvent.set(r.heat.eventId, { rank: r.rank, status: r.status });
                            }
                        } else if (!current) {
                            bestResultsPerEvent.set(r.heat.eventId, { rank: r.rank, status: r.status });
                        }
                    }
                });

                // Now iterate over the unique best results for this athlete
                bestResultsPerEvent.forEach(res => {
                    if (res.status === ResultStatus.FINISHED) {
                        if (res.rank === 1) { gold++; points += 10; }
                        else if (res.rank === 2) { silver++; points += 8; }
                        else if (res.rank === 3) { bronze++; points += 6; }
                        else if (res.rank === 4) { points += 5; }
                        else if (res.rank === 5) { points += 4; }
                        else if (res.rank === 6) { points += 3; }
                        else if (res.rank === 7) { points += 2; }
                        else if (res.rank === 8) { points += 1; }
                    }
                });
            });

            return {
                schoolId: s.id,
                schoolName: s.name,
                district: s.district,
                logoUrl: s.logoUrl,
                athletesCount: s.athletes.length,
                eventsParticipated: eventIds.size,
                gold,
                silver,
                bronze,
                totalPoints: points,
                shortCode: s.shortCode,
                contactName: s.contactName,
                contactEmail: s.contactEmail,
                contactPhone: s.contactPhone
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
                    else if (r.rank === 4) { points += 5; }
                    else if (r.rank === 5) { points += 4; }
                    else if (r.rank === 6) { points += 3; }
                    else if (r.rank === 7) { points += 2; }
                    else if (r.rank === 8) { points += 1; }
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
            logoUrl: school.logoUrl,
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

        // Helper to parse result value to number
        const parse = (val: string | null) => {
            if (!val) return e.eventType === EventType.TRACK ? Infinity : -Infinity;
            const num = parseFloat(val.replace(/[^\d.-]/g, ''));
            return isNaN(num) ? (e.eventType === EventType.TRACK ? Infinity : -Infinity) : num;
        };

        // For medalists, we typically only care about the "Final" phase if multiple exist.
        // A safe heuristic: Group results by athlete and take their BEST performance.
        const athleteBestResults = new Map<string, any>();
        allResults.forEach((r: any) => {
            const existing = athleteBestResults.get(r.athleteId);
            const currentVal = parse(r.resultValue);
            const existingVal = existing ? parse(existing.resultValue) : (e.eventType === EventType.TRACK ? Infinity : -Infinity);

            const isBetter = e.eventType === EventType.TRACK
                ? currentVal < existingVal
                : currentVal > existingVal;

            if (!existing || isBetter) {
                athleteBestResults.set(r.athleteId, r);
            }
        });

        // Global Sort for Medals
        const sortedForMedals = Array.from(athleteBestResults.values())
            .filter(r => r.status === ResultStatus.FINISHED)
            .sort((a, b) => {
                const valA = parse(a.resultValue);
                const valB = parse(b.resultValue);
                return e.eventType === EventType.TRACK ? valA - valB : valB - valA;
            });

        const getMedalist = (idx: number) => {
            const match = sortedForMedals[idx];
            return match ? {
                athleteName: match.athlete.name,
                schoolName: match.athlete.school.name
            } : null;
        };

        // All results for detailed list (keep them grouped by heats or just sorted globally?)
        // Let's sort globally but include everyone
        const globalSortedResults = [...allResults].sort((a, b) => (a.rank || 999) - (b.rank || 999));

        return {
            eventId: e.id,
            eventName: e.name,
            eventType: e.eventType,
            category: e.category,
            gender: e.gender,
            date: e.date,
            startTime: e.startTime,
            venue: e.venue,
            gold: getMedalist(0),
            silver: getMedalist(1),
            bronze: getMedalist(2),
            results: globalSortedResults.map((r: any) => ({
                athleteId: r.athleteId,
                athleteName: r.athlete.name,
                schoolName: r.athlete.school.name,
                bibNumber: r.bibNumber,
                status: r.status,
                resultValue: r.resultValue,
                rank: r.rank, // Original heat rank
                notes: r.notes
            }))
        };
    }

    async exportReport(query: ExportQueryDto) {
        if (query.format !== 'csv') {
            throw new NotImplementedException(`Format ${query.format} is not yet implemented.`);
        }

        let data: any[] = [];
        let fields: string[] = [];
        let filename = `report-${query.type}-${new Date().getTime()}.csv`;

        switch (query.type) {
            case 'schools':
                const schoolReports = await this.getSchoolReports();
                data = schoolReports.schools.map(s => ({
                    'School Name': s.schoolName,
                    'District': s.district,
                    'Short Code': s.shortCode,
                    'Contact Name': s.contactName,
                    'Contact Email': s.contactEmail,
                    'Contact Phone': s.contactPhone || '',
                    'Athletes': s.athletesCount,
                    'Events': s.eventsParticipated,
                    'Gold': s.gold,
                    'Silver': s.silver,
                    'Bronze': s.bronze,
                    'Points': s.totalPoints
                }));
                fields = ['School Name', 'District', 'Short Code', 'Contact Name', 'Contact Email', 'Contact Phone', 'Athletes', 'Events', 'Gold', 'Silver', 'Bronze', 'Points'];
                break;

            case 'athletes':
                const athleteReports = await this.prisma.athlete.findMany({
                    include: { school: true }
                });
                data = athleteReports.map(a => ({
                    'Name': a.name,
                    'Age': a.age,
                    'Gender': a.gender,
                    'Category': a.category,
                    'School': a.school.name,
                    'School ID': a.schoolId,
                    'Bib Number': a.bibNumber,
                    'Personal Best': a.personalBest || ''
                }));
                fields = ['Name', 'Age', 'Gender', 'Category', 'School', 'School ID', 'Bib Number', 'Personal Best'];
                break;

            case 'medals':
                // Using a simpler aggregation for medal tally
                const schools = await this.getSchoolReports();
                data = schools.schools.map((s, idx) => ({
                    'Rank': idx + 1,
                    'School': s.schoolName,
                    'District': s.district,
                    'Gold': s.gold,
                    'Silver': s.silver,
                    'Bronze': s.bronze,
                    'Total Points': s.totalPoints
                }));
                fields = ['Rank', 'School', 'District', 'Gold', 'Silver', 'Bronze', 'Total Points'];
                break;

            case 'events':
                const eventReports = await this.getEventReports({});
                data = eventReports.events.flatMap(e =>
                    e.results.map(r => ({
                        'Event': e.eventName,
                        'Type': e.eventType,
                        'Date': e.date,
                        'Start Time': e.startTime,
                        'Venue': e.venue || '',
                        'Category': e.category,
                        'Gender': e.gender,
                        'Athlete': r.athleteName,
                        'School': r.schoolName,
                        'Bib': r.bibNumber,
                        'Rank': r.rank || 'N/A',
                        'Result': r.resultValue || 'N/A',
                        'Status': r.status
                    }))
                );
                fields = ['Event', 'Type', 'Date', 'Start Time', 'Venue', 'Category', 'Gender', 'Athlete', 'School', 'Bib', 'Rank', 'Result', 'Status'];
                break;

            default:
                throw new NotImplementedException(`Export for ${query.type} is not yet implemented.`);
        }

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);
        const csvWithBom = BOM + csv;

        return {
            buffer: Buffer.from(csvWithBom, 'utf-8'),
            filename,
            contentType: 'text/csv; charset=utf-8'
        };
    }
}
