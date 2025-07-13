import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Currency } from './enums';

export enum BusinessStage {
  FOUNDATION = 'FOUNDATION',
  STARTUP = 'STARTUP',
  GROWTH = 'GROWTH',
  SCALE = 'SCALE',
  MATURE = 'MATURE',
}

@Entity('business_metrics')
@Index(['userId', 'date'])
export class BusinessMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, default: '43V3R' })
  businessName: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailyRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyRecurringRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  pipelineValue: number;

  @Column({ type: 'integer', default: 0 })
  activeUsers: number;

  @Column({ type: 'integer', default: 0 })
  activeClients: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyExpenses: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netProfit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 4881 })
  targetDailyRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 147917 })
  targetMonthlyRevenue: number;

  @Column({
    type: 'enum',
    enum: BusinessStage,
    default: BusinessStage.FOUNDATION,
  })
  stage: BusinessStage;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZAR,
  })
  currency: Currency;

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    conversionRate?: number;
    customerAcquisitionCost?: number;
    lifetimeValue?: number;
    churnRate?: number;
    growthRate?: number;
    burnRate?: number;
    runway?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  serviceBreakdown: {
    ai: number;
    web3: number;
    crypto: number;
    quantum: number;
    consulting: number;
    other: number;
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.businessMetrics)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  get revenueProgress(): number {
    return this.targetDailyRevenue > 0 ? (this.dailyRevenue / this.targetDailyRevenue) * 100 : 0;
  }
}