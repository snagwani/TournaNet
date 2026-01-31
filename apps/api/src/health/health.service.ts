import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface HealthResponse {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    database: 'connected' | 'disconnected';
}

@Injectable()
export class HealthService {
    constructor(private readonly prisma: PrismaService) { }

    async check(): Promise<HealthResponse> {
        let dbStatus: 'connected' | 'disconnected' = 'disconnected';

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch {
            dbStatus = 'disconnected';
        }

        return {
            status: dbStatus === 'connected' ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
        };
    }
}
