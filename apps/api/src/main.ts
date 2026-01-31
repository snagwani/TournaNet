import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });

    // Get services
    const configService = app.get(ConfigService);
    const logger = app.get(LoggerService);

    // Use custom logger
    app.useLogger(logger);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    // CORS for frontend
    app.enableCors({
        origin: configService.get<string>('CORS_ORIGIN', '*'),
        credentials: true,
    });

    // API prefix
    app.setGlobalPrefix('api');

    const port = configService.get<number>('API_PORT', 3001);
    await app.listen(port);

    logger.log(`🚀 TournaNet API running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
