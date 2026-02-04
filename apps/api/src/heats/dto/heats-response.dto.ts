import { Expose, Type } from 'class-transformer';

class LaneAssignmentDto {
    @Expose()
    laneNumber: number;

    @Expose()
    athleteId: string;

    @Expose()
    athleteName: string;

    @Expose()
    bibNumber: string;

    @Expose()
    personalBest: string | null;
}

class HeatDto {
    @Expose()
    heatNumber: number;

    @Expose()
    @Type(() => LaneAssignmentDto)
    lanes: LaneAssignmentDto[];
}

export class HeatsResponseDto {
    @Expose()
    eventId: string;

    @Expose()
    totalAthletes: number;

    @Expose()
    totalHeats: number;

    @Expose()
    @Type(() => HeatDto)
    heats: HeatDto[];

    constructor(partial: Partial<HeatsResponseDto>) {
        Object.assign(this, partial);
    }
}
