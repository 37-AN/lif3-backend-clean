import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Currency, AccountType, AccountProvider } from './enums';
import { Transaction } from './transaction.entity';
import { AccountBalance } from './account-balance.entity';


@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type: AccountType;

  @Column({
    type: 'enum',
    enum: AccountProvider,
  })
  provider: AccountProvider;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accountNumber: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZAR,
  })
  currency: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isConnected: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  institutionId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];

  @OneToMany(() => AccountBalance, (balance) => balance.account)
  balanceHistory: AccountBalance[];
}