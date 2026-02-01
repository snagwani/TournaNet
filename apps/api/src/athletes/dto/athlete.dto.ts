import { Expose } from 'class-transformer';
import { Gender, AthleteCategory } from '@prisma/client';

export class AthleteDto {
    @Expose()
    id: string;

    @Expose()
    bibNumber: number;

    @Expose()
    name: string;

    @Expose()
    age: number;

    @Expose()
    gender: Gender;

    @Expose()
    category: AthleteCategory;

    @Expose()
    schoolId: string;

    @Expose()
    personalBest: string | null;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<AthleteDto>) {
        Object.assign(this, partial);
    }
}
