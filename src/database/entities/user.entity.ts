import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Account } from './account.entity';
import { NetWorthSnapshot } from './net-worth-snapshot.entity';
import { BusinessMetrics } from './business-metrics.entity';
import { Goal } from './goal.entity';
import { AuditLog } from './audit-log.entity';
import { SecurityEvent } from './security-event.entity';

import { UserRole, Currency, Theme } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ type: 'integer', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'boolean', default: false })
  accountLocked: boolean;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netWorth: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  liquidCash: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  investments: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  businessEquity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 1800000 })
  targetNetWorth: number;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    currency: Currency;
    theme: Theme;
    notifications: boolean;
    timezone: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => NetWorthSnapshot, (snapshot) => snapshot.user)
  netWorthSnapshots: NetWorthSnapshot[];

  @OneToMany(() => BusinessMetrics, (metrics) => metrics.user)
  businessMetrics: BusinessMetrics[];

  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  @OneToMany(() => SecurityEvent, (securityEvent) => securityEvent.user)
  securityEvents: SecurityEvent[];

  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get progressPercentage(): number {
    return this.targetNetWorth > 0 ? (this.netWorth / this.targetNetWorth) * 100 : 0;
  }
}