import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Account } from './entities/account.entity';
import { AccountBalance } from './entities/account-balance.entity';
import { NetWorthSnapshot } from './entities/net-worth-snapshot.entity';
import { BusinessMetrics } from './entities/business-metrics.entity';
import { Goal } from './entities/goal.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SecurityEvent } from './entities/security-event.entity';

const configService = new ConfigService();

// Use DATABASE_URL for production, fallback to individual settings for development
const databaseUrl = configService.get<string>('DATABASE_URL');

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        entities: [
          User,
          Transaction,
          Account,
          AccountBalance,
          NetWorthSnapshot,
          BusinessMetrics,
          Goal,
          AuditLog,
          SecurityEvent,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production', // Don't auto-sync in production
        logging: configService.get('NODE_ENV') !== 'production',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'ccladysmith'),
        password: configService.get('DB_PASSWORD', 'password123'),
        database: configService.get('DB_DATABASE', 'lif3_db'),
        entities: [
          User,
          Transaction,
          Account,
          AccountBalance,
          NetWorthSnapshot,
          BusinessMetrics,
          Goal,
          AuditLog,
          SecurityEvent,
        ],
        synchronize: true,
        logging: true,
      }
);