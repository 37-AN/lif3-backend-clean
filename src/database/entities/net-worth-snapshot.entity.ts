import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Currency } from './enums';

@Entity('net_worth_snapshots')
@Index(['userId', 'createdAt'])
export class NetWorthSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netWorth: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  liquidCash: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  investments: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  businessEquity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAssets: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalLiabilities: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  targetNetWorth: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  progressPercentage: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZAR,
  })
  currency: Currency;

  @Column({ type: 'jsonb', nullable: true })
  breakdown: {
    accounts: {
      accountId: string;
      accountName: string;
      balance: number;
    }[];
    investments: {
      type: string;
      value: number;
    }[];
    business: {
      dailyRevenue: number;
      mrr: number;
      valuation: number;
    };
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.netWorthSnapshots)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}