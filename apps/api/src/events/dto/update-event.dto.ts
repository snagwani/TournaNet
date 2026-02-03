import { IsDateString, IsOptional, IsString, Matches, IsEnum } from 'class-validator';
import { AthleteCategory, Gender } from '@prisma/client';

export class UpdateEventDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'startTime must be in HH:mm format'
    })
    startTime?: string;

    @IsOptional()
    @IsString()
    venue?: string;

    @IsOptional()
    @IsEnum(AthleteCategory)
    category?: AthleteCategory;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;
}
