import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

interface HealthResponse {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    database: 'connected' | 'disconnected';
}

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    async check(): Promise<HealthResponse> {
        return this.healthService.check();
    }
}
