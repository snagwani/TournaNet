import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context?: string;
    message: string;
    trace?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
    private readonly isDevelopment: boolean;

    constructor(private readonly configService: ConfigService) {
        this.isDevelopment = configService.get('NODE_ENV') !== 'production';
    }

    log(message: string, context?: string): void {
        this.output('log', message, context);
    }

    error(message: string, trace?: string, context?: string): void {
        this.output('error', message, context, trace);
    }

    warn(message: string, context?: string): void {
        this.output('warn', message, context);
    }

    debug(message: string, context?: string): void {
        if (this.isDevelopment) {
            this.output('debug', message, context);
        }
    }

    verbose(message: string, context?: string): void {
        if (this.isDevelopment) {
            this.output('verbose', message, context);
        }
    }

    private output(level: LogLevel, message: string, context?: string, trace?: string): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            context,
            message,
        };

        if (trace) {
            entry.trace = trace;
        }

        if (this.isDevelopment) {
            // Pretty print in development
            const color = this.getColor(level);
            const prefix = context ? `[${context}] ` : '';
            const output = `${color}${entry.timestamp} ${level.toUpperCase()}\x1b[0m ${prefix}${message}`;

            switch (level) {
                case 'error':
                    console.error(output);
                    break;
                case 'warn':
                    console.warn(output);
                    break;
                case 'debug':
                case 'verbose':
                    console.debug(output);
                    break;
                default:
                    console.log(output);
            }

            if (trace) {
                console.error(trace);
            }
        } else {
            // JSON output in production for log aggregation
            console.log(JSON.stringify(entry));
        }
    }

    private getColor(level: LogLevel): string {
        const colors: Record<LogLevel, string> = {
            log: '\x1b[32m',     // Green
            error: '\x1b[31m',   // Red
            warn: '\x1b[33m',    // Yellow
            debug: '\x1b[36m',   // Cyan
            verbose: '\x1b[35m', // Magenta
        };
        return colors[level];
    }
}
