import { Expose } from 'class-transformer';

export class SchoolDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    district: string;

    @Expose()
    contactName: string;

    @Expose()
    contactEmail: string;

    @Expose()
    contactPhone: string | null;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<SchoolDto>) {
        Object.assign(this, partial);
    }
}
