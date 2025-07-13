import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('security_events')
@Index(['userId', 'createdAt'])
@Index(['eventType', 'severity'])
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SecurityEventType,
  })
  eventType: SecurityEventType;

  @Column({
    type: 'enum',
    enum: SecuritySeverity,
  })
  severity: SecuritySeverity;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  sourceIp: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    requestId?: string;
    sessionId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    attempts?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.securityEvents, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;
}