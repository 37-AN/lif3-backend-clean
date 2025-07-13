import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Account } from './entities/account.entity';
import { AccountBalance } from './entities/account-balance.entity';
import { NetWorthSnapshot } from './entities/net-worth-snapshot.entity';
import { BusinessMetrics } from './entities/business-metrics.entity';
import { Goal } from './entities/goal.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SecurityEvent } from './entities/security-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: './storage/lif3_database.sqlite',
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
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Transaction,
      Account,
      AccountBalance,
      NetWorthSnapshot,
      BusinessMetrics,
      Goal,
      AuditLog,
      SecurityEvent,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}