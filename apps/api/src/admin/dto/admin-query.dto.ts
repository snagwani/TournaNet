import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class AthleteReportQueryDto {
    @IsOptional()
    @IsUUID()
    schoolId?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsEnum(['MALE', 'FEMALE'])
    gender?: 'MALE' | 'FEMALE';
}

export class ExportQueryDto {
    @IsString()
    @IsEnum(['schools', 'athletes', 'medals', 'events'])
    type: string;

    @IsString()
    @IsEnum(['csv', 'pdf'])
    format: string;
}
