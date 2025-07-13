import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Currency, BalanceSource } from './enums';
import { Account } from './account.entity';


@Entity('account_balances')
@Index(['accountId', 'createdAt'])
export class AccountBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  availableBalance: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZAR,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: BalanceSource,
  })
  source: BalanceSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceReference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    syncId?: string;
    institutionTransactionId?: string;
    confidence?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Account, (account) => account.balanceHistory)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ type: 'uuid' })
  accountId: string;
}