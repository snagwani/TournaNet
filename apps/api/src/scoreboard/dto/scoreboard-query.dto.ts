import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpcomingQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    windowMinutes?: number = 120;
}

export class ResultsQueryDto {
    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsEnum(['TRACK', 'FIELD'])
    eventType?: 'TRACK' | 'FIELD';
}

export class AthleteSearchQueryDto {
    @IsString()
    q: string;
}
