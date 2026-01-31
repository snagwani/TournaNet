import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: LoggerService) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse as Record<string, unknown>;
                message = (responseObj.message as string | string[]) || exception.message;
                error = (responseObj.error as string) || exception.name;
            } else {
                message = exception.message;
                error = exception.name;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;
        }

        const errorResponse: ErrorResponse = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        // Log the error
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
            exception instanceof Error ? exception.stack : undefined,
            'HttpExceptionFilter',
        );

        response.status(status).json(errorResponse);
    }
}
