import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateScheduleDto {
    @IsDateString()
    startDate: string;

    @IsInt()
    @Min(1)
    days: number = 2;

    @IsOptional()
    @IsInt()
    @Min(0)
    trackGapMinutes: number = 15;

    @IsOptional()
    @IsInt()
    @Min(0)
    athleteRestMinutes: number = 60;
}
