import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Currency } from './enums';

export enum GoalType {
  NET_WORTH = 'NET_WORTH',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT',
  BUSINESS_REVENUE = 'BUSINESS_REVENUE',
  DEBT_REDUCTION = 'DEBT_REDUCTION',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  CUSTOM = 'CUSTOM',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('goals')
@Index(['userId', 'status'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZAR,
  })
  currency: Currency;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({
    type: 'enum',
    enum: GoalPriority,
    default: GoalPriority.MEDIUM,
  })
  priority: GoalPriority;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  monthlyTarget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  weeklyTarget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  dailyTarget: number;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recurringPattern: string;

  @Column({ type: 'jsonb', nullable: true })
  milestones: {
    amount: number;
    date: Date;
    achieved: boolean;
    note?: string;
  }[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.goals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  get progressPercentage(): number {
    return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
  }

  get remainingAmount(): number {
    return Math.max(0, this.targetAmount - this.currentAmount);
  }

  get daysRemaining(): number {
    const today = new Date();
    const deadline = new Date(this.deadline);
    const timeDiff = deadline.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}