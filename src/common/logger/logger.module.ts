import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggerService } from './logger.service';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.prettyPrint()
);

const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/lif3-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  format: logFormat,
  zippedArchive: true,
});

const errorFileRotateTransport = new DailyRotateFile({
  filename: 'logs/lif3-error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  level: 'error',
  format: logFormat,
  zippedArchive: true,
});

const financialAuditTransport = new DailyRotateFile({
  filename: 'logs/financial-audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '365d',
  maxSize: '50m',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  zippedArchive: true,
});

const securityAuditTransport = new DailyRotateFile({
  filename: 'logs/security-audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '365d',
  maxSize: '50m',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  zippedArchive: true,
});

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.cli(),
            winston.format.splat(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(
              (info) => `${info.timestamp} [${info.level}] ${info.message}`
            )
          ),
        }),
        fileRotateTransport,
        errorFileRotateTransport,
        financialAuditTransport,
        securityAuditTransport,
      ],
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}