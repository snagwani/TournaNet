import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { EventType, Event } from '@prisma/client';

@Injectable()
export class ScheduleService {
    private readonly logger = new Logger(ScheduleService.name);

    constructor(private readonly prisma: PrismaService) { }

    async generate(dto: GenerateScheduleDto) {
        // 1. Fetch all events
        const events = await this.prisma.event.findMany();

        // 2. Separate Types
        const trackEvents = events.filter(e => e.eventType === EventType.TRACK);
        const fieldEvents = events.filter(e => e.eventType === EventType.FIELD);

        // 3. Initialize Schedule Structure
        const scheduleDays = [];
        const startDate = new Date(dto.startDate);

        // Mock Durations
        const TRACK_DURATION = 30; // minutes
        const FIELD_DURATION = 60; // minutes

        // 4. Scheduling Logic per Day
        // For simplicity, we split events across days evenly or just fill day 1 then day 2.
        // Let's simple-fill Day 1 until 17:00, then move to Day 2.

        let currentDayIndex = 0;
        let dayEvents: any[] = [];

        // --- Schedule TRACK Events (Sequential) ---
        let currentTimeMinutes = 8 * 60; // 08:00
        const lunchStart = 13 * 60;
        const lunchEnd = 14 * 60;
        const dayEnd = 17 * 60;

        // Process Track Events
        const scheduledTrackEvents = [];

        // Helper to get current Date string
        const getDateString = (dayIdx: number) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + dayIdx);
            return d.toISOString().split('T')[0];
        };

        for (const event of trackEvents) {
            // Check if event fits in current day
            if (currentTimeMinutes + TRACK_DURATION > dayEnd) {
                // Determine Day End, Push Day, Reset
                // Since Field events also need scheduling, we handle them separately but they share the Day objects.
                // We'll organize by Day objects later. 
                // Wait, "Loop Days" strategy is better.
                // Reset for next day
                currentDayIndex++;
                currentTimeMinutes = 8 * 60;
            }

            // Check Lunch
            if (currentTimeMinutes >= lunchStart && currentTimeMinutes < lunchEnd) {
                currentTimeMinutes = lunchEnd;
            } else if (currentTimeMinutes + TRACK_DURATION > lunchStart && currentTimeMinutes < lunchEnd) {
                // If overlap lunch, push to after lunch
                currentTimeMinutes = lunchEnd;
            }

            // Assign Time
            const startStr = this.minutesToTime(currentTimeMinutes);
            const endMinutes = currentTimeMinutes + TRACK_DURATION;
            const endStr = this.minutesToTime(endMinutes);

            scheduledTrackEvents.push({
                ...event,
                dayIndex: currentDayIndex,
                startTime: startStr,
                endTime: endStr,
                schedStart: currentTimeMinutes,
                schedEnd: endMinutes,
                duration: TRACK_DURATION
            });

            // Advance time + Gap
            currentTimeMinutes = endMinutes + dto.trackGapMinutes;
        }

        // --- Schedule FIELD Events (Parallel to Track, Sequential to each other for simplicity) ---
        // We reset pointers for Field stream
        currentDayIndex = 0;
        currentTimeMinutes = 8 * 60;

        const scheduledFieldEvents = [];

        for (const event of fieldEvents) {
            // Logic similar to Track but independent stream
            if (currentTimeMinutes + FIELD_DURATION > dayEnd) {
                currentDayIndex++;
                currentTimeMinutes = 8 * 60;
            }

            // Check Lunch (Field events also respect lunch)
            if (currentTimeMinutes >= lunchStart && currentTimeMinutes < lunchEnd) {
                currentTimeMinutes = lunchEnd;
            } else if (currentTimeMinutes + FIELD_DURATION > lunchStart && currentTimeMinutes < lunchEnd) {
                currentTimeMinutes = lunchEnd;
            }

            const startStr = this.minutesToTime(currentTimeMinutes);
            const endMinutes = currentTimeMinutes + FIELD_DURATION;
            const endStr = this.minutesToTime(endMinutes);

            scheduledFieldEvents.push({
                ...event,
                dayIndex: currentDayIndex,
                startTime: startStr,
                endTime: endStr,
                schedStart: currentTimeMinutes,
                schedEnd: endMinutes,
                duration: FIELD_DURATION
            });

            // Advance time (gap? maybe small gap or 0)
            currentTimeMinutes = endMinutes + 10;
        }

        // 5. Combine and Conflict Detection
        const allScheduled = [...scheduledTrackEvents, ...scheduledFieldEvents];

        // Group by Day for Response
        const responseDays = [];
        for (let i = 0; i < dto.days; i++) {
            const dayDate = getDateString(i);
            const daysEvents = allScheduled.filter(e => e.dayIndex === i)
                .map(e => {
                    const conflicts = this.detectConflicts(e, allScheduled.filter(s => s.dayIndex === i), dto.athleteRestMinutes);
                    return {
                        eventId: e.id,
                        name: e.name,
                        eventType: e.eventType,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        venue: e.venue,
                        conflicts
                    };
                });

            responseDays.push({
                date: dayDate,
                events: daysEvents
            });
        }

        return { days: responseDays };
    }

    private minutesToTime(mins: number): string {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    private detectConflicts(event: any, daysEvents: any[], restMinutes: number): any[] {
        const conflicts = [];

        // LUNCH_VIOLATION
        if (event.schedStart < (14 * 60) && event.schedEnd > (13 * 60)) {
            // Overlap [13:00, 14:00)
            // Logic in scheduling tried to avoid it, but if it failed or logic edge case:
            // Actually my logic pushed start to 14:00 if overlap.
            // But strict check:
            const lunchStart = 13 * 60;
            const lunchEnd = 14 * 60;
            // Overlap Logic: Start < B_End && End > B_Start
            if (event.schedStart < lunchEnd && event.schedEnd > lunchStart) {
                conflicts.push({
                    type: 'LUNCH_VIOLATION',
                    description: 'Event overlaps with lunch break (13:00-14:00)',
                    affectedAthleteIds: []
                });
            }
        }

        // ATHLETE_CONFLICT (Category/Gender Match = Overlap)
        // Find other events that overlap in time AND share category/gender
        const overlapping = daysEvents.filter(other =>
            other.id !== event.id &&
            other.schedStart < event.schedEnd &&
            other.schedEnd > event.schedStart
        );

        for (const other of overlapping) {
            if (other.gender === event.gender && other.category === event.category) {
                conflicts.push({
                    type: 'ATHLETE_CONFLICT',
                    description: `Potential conflict with ${other.name} (Same Category/Gender)`,
                    affectedAthleteIds: [] // We don't list IDs for this broad check
                });
            }
        }

        // REST_VIOLATION
        // Check events ending within restMinutes before this Start OR starting within restMinutes after this End
        // AND share category/gender
        const restWindowEvents = daysEvents.filter(other =>
            other.id !== event.id &&
            other.gender === event.gender &&
            other.category === event.category
        );

        for (const other of restWindowEvents) {
            // Case 1: Other ends just before Event starts
            // Gap = EventStart - OtherEnd
            if (other.schedEnd <= event.schedStart) {
                const gap = event.schedStart - other.schedEnd;
                if (gap < restMinutes) {
                    conflicts.push({
                        type: 'REST_VIOLATION',
                        description: `Insufficient rest after ${other.name} (${gap}m < ${restMinutes}m)`,
                        affectedAthleteIds: []
                    });
                }
            }
            // Case 2: Other starts just after Event ends
            // Gap = OtherStart - EventEnd
            if (other.schedStart >= event.schedEnd) {
                const gap = other.schedStart - event.schedEnd;
                if (gap < restMinutes) {
                    conflicts.push({
                        type: 'REST_VIOLATION',
                        description: `Insufficient rest before ${other.name} (${gap}m < ${restMinutes}m)`,
                        affectedAthleteIds: []
                    });
                }
            }
        }

        return conflicts;
    }
}
