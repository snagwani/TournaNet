import { Expose, Type } from 'class-transformer';
import { ResultStatus } from './submit-results.dto';

export class ResultSummaryDto {
    @Expose() totalAthletes: number;
    @Expose() finishedCount: number;
    @Expose() dnsCount: number;
    @Expose() dnfCount: number;
    @Expose() dqCount: number;
}

export class RankedResultDto {
    @Expose() athleteId: string;
    @Expose() bibNumber: number;
    @Expose() resultValue: string | null;
    @Expose() status: ResultStatus;
    @Expose() rank: number | null;
    @Expose() notes: string | null;
    @Expose() qualified: boolean;
}

export class ResultsResponseDto {
    @Expose() eventId: string;
    @Expose() heatId: string;

    @Expose()
    @Type(() => RankedResultDto)
    results: RankedResultDto[];

    @Expose()
    @Type(() => ResultSummaryDto)
    summary: ResultSummaryDto;
}
