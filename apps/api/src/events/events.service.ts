import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto } from './dto/event.dto';
import { Prisma, EventType } from '@prisma/client';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(private readonly prisma: PrismaService) { }

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
                    date: new Date(createEventDto.date),
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
}
