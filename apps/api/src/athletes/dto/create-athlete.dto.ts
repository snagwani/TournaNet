import { IsString, IsInt, IsEnum, IsUUID, IsOptional, Length, Min, Max, IsNotEmpty } from 'class-validator';
import { Gender, AthleteCategory } from '@prisma/client';

export class CreateAthleteDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    name: string;

    @IsInt()
    @Min(10)
    @Max(19)
    age: number;

    @IsEnum(Gender)
    gender: Gender;

    @IsEnum(AthleteCategory)
    category: AthleteCategory;

    @IsUUID()
    schoolId: string;

    @IsOptional()
    @IsString()
    personalBest?: string;
}
