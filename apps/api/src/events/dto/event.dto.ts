import { Expose } from 'class-transformer';
import { Gender, AthleteCategory, EventType } from '@prisma/client';

export class EventDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    eventType: EventType;

    @Expose()
    gender: Gender;

    @Expose()
    category: AthleteCategory;

    @Expose()
    date: Date;

    @Expose()
    startTime: string;

    @Expose()
    venue: string | null;

    @Expose()
    rules: any;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<EventDto>) {
        Object.assign(this, partial);
    }
}
