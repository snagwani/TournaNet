import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly logger: LoggerService) {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ],
        });
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL database', 'PrismaService');
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
        this.logger.log('Disconnected from PostgreSQL database', 'PrismaService');
    }
}
