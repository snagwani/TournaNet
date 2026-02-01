import { IsEnum, IsOptional } from 'class-validator';

export enum SeedingStrategy {
    PB_ASC = 'PB_ASC',
    RANDOM = 'RANDOM'
}

export enum LaneAssignmentStrategy {
    STANDARD = 'STANDARD'
}

export class GenerateHeatsDto {
    @IsOptional()
    @IsEnum(SeedingStrategy)
    seedingStrategy?: SeedingStrategy = SeedingStrategy.PB_ASC;

    @IsOptional()
    @IsEnum(LaneAssignmentStrategy)
    laneAssignment?: LaneAssignmentStrategy = LaneAssignmentStrategy.STANDARD;
}
