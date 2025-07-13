import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Account } from './account.entity';
import { Currency } from './enums';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  INVESTMENT = 'INVESTMENT',
  BUSINESS_REVENUE = 'BUSINESS_REVENUE',
  BUSINESS_EXPENSE = 'BUSINESS_EXPENSE',
}

export enum TransactionCategory {
  SALARY = 'SALARY',
  FREELANCE = 'FREELANCE',
  BUSINESS_INCOME = 'BUSINESS_INCOME',
  INVESTMENT_INCOME = 'INVESTMENT_INCOME',
  GROCERIES = 'GROCERIES',
  UTILITIES = 'UTILITIES',
  RENT = 'RENT',
  TRANSPORT = 'TRANSPORT',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  SHOPPING = 'SHOPPING',
  BUSINESS_EXPENSE = 'BUSINESS_EXPENSE',
  INVESTMENT = 'INVESTMENT',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('transactions')
@Index(['userId', 'date'])
@Index(['accountId', 'date'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZAR,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  category: TransactionCategory;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankReference: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balanceAfter: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    location?: string;
    merchant?: string;
    paymentMethod?: string;
    tags?: string[];
    receiptUrl?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recurringPattern: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'uuid' })
  accountId: string;
}