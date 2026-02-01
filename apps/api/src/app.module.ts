import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { HealthModule } from './health/health.module';
import { appConfig } from './config/app.config';
import { SchoolsModule } from './schools/schools.module';
import { AthletesModule } from './athletes/athletes.module';

@Module({
    imports: [
        // Environment configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            envFilePath: ['.env.local', '.env'],
        }),

        // Core modules
        LoggerModule,
        PrismaModule,

        // Feature modules
        HealthModule,
        SchoolsModule,
        AthletesModule,
    ],
})
export class AppModule { }
