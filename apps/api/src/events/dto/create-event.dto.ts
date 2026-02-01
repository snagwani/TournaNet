import { IsString, IsEnum, IsDateString, Matches, IsObject, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, AthleteCategory, EventType } from '@prisma/client';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(EventType)
    eventType: EventType;

    @IsEnum(Gender)
    gender: Gender;

    @IsEnum(AthleteCategory)
    category: AthleteCategory;

    @IsDateString()
    date: string; // ISO Date

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
    startTime: string;

    @IsOptional()
    @IsString()
    venue?: string;

    @IsObject()
    rules: Record<string, any>; // Polymorphic validation handled in Service
}
