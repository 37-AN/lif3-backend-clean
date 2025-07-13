import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SYNC = 'SYNC',
  BACKUP = 'BACKUP',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum AuditEntityType {
  USER = 'USER',
  TRANSACTION = 'TRANSACTION',
  ACCOUNT = 'ACCOUNT',
  GOAL = 'GOAL',
  BUSINESS_METRICS = 'BUSINESS_METRICS',
  NET_WORTH_SNAPSHOT = 'NET_WORTH_SNAPSHOT',
  SYSTEM = 'SYSTEM',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
  })
  entityType: AuditEntityType;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    requestId?: string;
    sessionId?: string;
    correlation?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;
}