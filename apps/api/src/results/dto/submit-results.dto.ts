import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export enum ResultStatus {
    FINISHED = 'FINISHED',
    DNS = 'DNS',
    DNF = 'DNF',
    DQ = 'DQ'
}

export class ResultEntryDto {
    @IsUUID()
    @IsNotEmpty()
    athleteId: string;

    @IsNumber()
    @IsNotEmpty()
    bibNumber: number;

    @IsEnum(ResultStatus)
    @IsNotEmpty()
    status: ResultStatus;

    @ValidateIf(o => o.status === ResultStatus.FINISHED)
    @IsString()
    @IsNotEmpty()
    resultValue: string | null;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class SubmitResultsDto {
    @Type(() => ResultEntryDto)
    @ValidateNested({ each: true })
    @IsNotEmpty()
    results: ResultEntryDto[];
}
