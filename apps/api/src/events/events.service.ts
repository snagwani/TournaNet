import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventDto } from './dto/event.dto';
import { Prisma, EventType, Gender, AthleteCategory } from '@prisma/client';
import { TOURNAMENT_TIMEZONE } from '../common/constants';
import { fromZonedTime } from 'date-fns-tz';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findAll(date?: string): Promise<EventDto[]> {
        const where: Prisma.EventWhereInput = {};
        if (date) {
            // Convert the date string (e.g., "2026-02-05") to a UTC Date object representing that day in Tournament Time
            where.date = fromZonedTime(date, TOURNAMENT_TIMEZONE);
        }

        const events = await this.prisma.event.findMany({
            where,
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ],
            include: {
                heats: {
                    select: {
                        id: true,
                        heatNumber: true,
                        _count: {
                            select: { results: true }
                        }
                    }
                }
            }
        });

        return events.map(e => new EventDto(e));
    }

    async findOne(id: string) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                heats: {
                    include: {
                        lanes: {
                            include: {
                                athlete: {
                                    include: { school: true }
                                }
                            }
                        },
                        results: true
                    },
                    orderBy: { heatNumber: 'asc' }
                }
            }
        });

        if (!event) {
            throw new BadRequestException('Event not found');
        }

        return event;
    }

    async update(id: string, dto: UpdateEventDto): Promise<EventDto> {
        this.logger.log(`Updating event: ${id}`);

        if (dto.startTime) {
            this.validateTime(dto.startTime);
        }

        try {
            const event = await this.prisma.event.update({
                where: { id },
                data: {
                    ...dto,
                    date: dto.date ? fromZonedTime(dto.date, TOURNAMENT_TIMEZONE) : undefined
                },
            });

            return new EventDto(event);
        } catch (error) {
            this.logger.error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown'}`);
            throw new InternalServerErrorException('Failed to update event');
        }
    }

    async create(createEventDto: CreateEventDto): Promise<EventDto> {
        this.logger.log(`Creating event: ${createEventDto.name} (${createEventDto.eventType})`);

        // 1. Validate Time Rules
        this.validateTime(createEventDto.startTime);

        // 2. Validate Polymorphic Rules
        this.validateRules(createEventDto.eventType, createEventDto.rules);

        try {
            const event = await this.prisma.event.create({
                data: {
                    name: createEventDto.name,
                    eventType: createEventDto.eventType,
                    gender: createEventDto.gender,
                    category: createEventDto.category,
                    date: fromZonedTime(createEventDto.date, TOURNAMENT_TIMEZONE),
                    startTime: createEventDto.startTime,
                    venue: createEventDto.venue,
                    rules: createEventDto.rules as Prisma.InputJsonValue,
                },
            });

            this.logger.log(`Event created: ${event.id}`);
            return new EventDto(event);

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // Duplicate constraint (P2002)
                if (error.code === 'P2002') {
                    this.logger.warn(`Duplicate event: ${createEventDto.name}`);
                    throw new BadRequestException('Event with this name already exists for this gender/category');
                }
            }
            this.logger.error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown'}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Failed to create event');
        }
    }

    private validateTime(startTime: string) {
        // Format verified by DTO (HH:mm)
        const [hours, minutes] = startTime.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;

        const START_WINDOW = 8 * 60;       // 08:00
        const END_WINDOW = 17 * 60;        // 17:00
        const LUNCH_START = 13 * 60;       // 13:00
        const LUNCH_END = 14 * 60;         // 14:00

        if (timeInMinutes < START_WINDOW || timeInMinutes > END_WINDOW) {
            throw new BadRequestException(`Event start time ${startTime} is outside allowed window (08:00 - 17:00)`);
        }

        // Check for Lunch Break overlap (Cannot START between 13:00 and 14:00)
        // Rule: "No event can start between 13:00–14:00"
        // Strict interpretation: 13:00 <= start < 14:00? Or just strictly between?
        // Usually means lunch is 13:00-14:00, so start times >= 13:00 and < 14:00 are invalid.
        if (timeInMinutes >= LUNCH_START && timeInMinutes < LUNCH_END) {
            throw new BadRequestException(`Event cannot start during lunch break (13:00 - 14:00)`);
        }
    }

    private validateRules(type: EventType, rules: any) {
        if (type === EventType.TRACK) {
            // Check essential keys. Defaults handled in Service logic? 
            // Spec says "Qualification Rule (default...)" but we just store what's passed or default it here?
            // The prompt said "Persist rules as structured JSON". It didn't enforce defaults here, 
            // but validation "TRACK and FIELD rules must not mix" is key.
            // Simplified check: Track should not have 'attempts' (Field specific)

            // Actually, we should check relevant keys exist or are optional.
            // If strictly enforcing schema: 
            // Track: maxAthletesPerHeat (number), qualificationRule (string)
            if (rules.attempts !== undefined || rules.finalists !== undefined) {
                throw new BadRequestException('TRACK events cannot have FIELD rule properties (attempts, finalists)');
            }
        } else if (type === EventType.FIELD) {
            // Field: maxAthletesPerFlight, attempts, finalists
            if (rules.maxAthletesPerHeat !== undefined || rules.qualificationRule !== undefined) {
                throw new BadRequestException('FIELD events cannot have TRACK rule properties (maxAthletesPerHeat)');
            }
        }
    }

    async bulkImport(buffer: Buffer) {
        this.logger.log('Starting bulk import of events...');

        // Detect delimiter
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

        this.logger.log(`Event import info: Line1: [${headerLine}] Delimiter: "${delimiter === '\t' ? '\\t' : delimiter}"`);

        const results: any[] = [];
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv({
                    separator: delimiter,
                    mapHeaders: ({ header }) => {
                        return header
                            .replace(/^\uFEFF/, '')
                            .replace(/"/g, '')
                            .trim()
                            .toLowerCase()
                            .replace(/ /g, '')
                            .replace(/_/g, '');
                    }
                }))
                .on('data', (data: any) => {
                    results.push(data);
                })
                .on('end', async () => {
                    this.logger.log(`CSV parsing complete. Found ${results.length} rows.`);
                    const report = {
                        total: results.length,
                        success: 0,
                        failed: 0,
                        errors: [] as string[]
                    };

                    const clean = (val: any) => (val || '').toString().trim().replace(/^"|"$/g, '');

                    for (const [index, row] of results.entries()) {
                        let currentName = 'Unknown';
                        try {
                            const findValue = (searchKeys: string[]) => {
                                for (const searchKey of searchKeys) {
                                    const foundKey = Object.keys(row).find(k => {
                                        const cleanK = k.replace(/"/g, '').toLowerCase().replace(/ /g, '').replace(/_/g, '');
                                        return searchKey === cleanK;
                                    });
                                    if (foundKey) return clean(row[foundKey]);
                                }
                                return '';
                            };

                            const name = findValue(['name', 'eventname', 'event']);
                            currentName = name;
                            const rawType = findValue(['eventtype', 'type']);
                            const gender = findValue(['gender', 'sex']).toUpperCase() as Gender;
                            const category = findValue(['category', 'division', 'agegroup']).toUpperCase() as AthleteCategory;
                            const date = findValue(['date', 'eventdate', 'day']);
                            const startTime = findValue(['starttime', 'time', 'start']);
                            const venue = findValue(['venue', 'location', 'ground']) || undefined;

                            this.logger.log(`Processing event ${index + 1}: ${name || 'Unknown'}`);

                            // Basic validation
                            if (!name || !rawType || !gender || !category || !date || !startTime) {
                                const missing = [];
                                if (!name) missing.push('name');
                                if (!rawType) missing.push('eventType');
                                if (!gender) missing.push('gender');
                                if (!category) missing.push('category');
                                if (!date) missing.push('date');
                                if (!startTime) missing.push('startTime');

                                // Check if user is using the wrong tool
                                const isResultFile = Object.keys(row).some(k => ['bib', 'result', 'rank'].includes(k.toLowerCase().replace(/ /g, '')));
                                if (isResultFile) {
                                    throw new Error(`This looks like a Results file. Please use the Green "Import Results" button instead of the Event Importer.`);
                                }

                                throw new Error(`Missing required fields: ${missing.join(', ')}`);
                            }

                            const eventType = rawType.toUpperCase() as EventType;

                            // Map rules from CSV columns
                            const rules: any = {};
                            const max_param_str = clean(row.maxparam || row.maxathletes || row.max);
                            const max_param = parseInt(max_param_str);
                            const rule_param = clean(row.ruleparam || row.rule);

                            if (eventType === EventType.TRACK) {
                                rules.maxAthletesPerHeat = max_param || 8;
                                rules.qualificationRule = rule_param || 'TOP_2_PER_HEAT';
                            } else {
                                rules.maxAthletesPerFlight = max_param || 12;
                                rules.attempts = parseInt(rule_param.split('_')[0]) || 3;
                                rules.finalists = 8; // Default
                            }

                            // Upsert logic: find existing by name + date + category + gender
                            const existing = await this.prisma.event.findFirst({
                                where: {
                                    name: { equals: name, mode: 'insensitive' },
                                    date,
                                    category: category as any,
                                    gender: gender as any
                                }
                            });

                            if (existing) {
                                await this.prisma.event.update({
                                    where: { id: existing.id },
                                    data: {
                                        startTime,
                                        venue,
                                        rules: rules as any
                                    }
                                });
                            } else {
                                const createDto: CreateEventDto = {
                                    name,
                                    eventType,
                                    gender: gender as any,
                                    category: category as any,
                                    date,
                                    startTime,
                                    venue,
                                    rules
                                };
                                await this.create(createDto);
                            }
                            report.success++;
                        } catch (err: any) {
                            const keys = Object.keys(row).join(', ');
                            this.logger.error(`Event row ${index + 1} failed: ${err.message}. Row keys: ${keys}`);
                            report.failed++;
                            report.errors.push(`Row ${index + 1} (${currentName}): ${err.message} (Found columns: ${keys})`);
                        }
                    }
                    this.logger.log(`Bulk event import complete. Success: ${report.success}, Failed: ${report.failed}`);
                    resolve(report);
                })
                .on('error', (err: any) => {
                    this.logger.error(`CSV Parsing stream error: ${err.message}`);
                    reject(new InternalServerErrorException('CSV parsing failed'));
                });
        });
    }
}
