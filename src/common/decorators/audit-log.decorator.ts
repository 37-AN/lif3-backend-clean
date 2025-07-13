import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogOptions {
  entity: 'TRANSACTION' | 'ACCOUNT' | 'GOAL' | 'BALANCE' | 'USER' | 'BUSINESS_METRIC';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  sensitive?: boolean;
  description?: string;
}

export const AuditLog = (options: AuditLogOptions) => SetMetadata(AUDIT_LOG_KEY, options);

export const LogFinancialTransaction = (description?: string) => 
  AuditLog({
    entity: 'TRANSACTION',
    action: 'CREATE',
    sensitive: true,
    description
  });

export const LogAccountUpdate = (description?: string) => 
  AuditLog({
    entity: 'ACCOUNT',
    action: 'UPDATE',
    sensitive: true,
    description
  });

export const LogGoalProgress = (description?: string) => 
  AuditLog({
    entity: 'GOAL',
    action: 'UPDATE',
    sensitive: false,
    description
  });

export const LogBusinessMetric = (description?: string) => 
  AuditLog({
    entity: 'BUSINESS_METRIC',
    action: 'CREATE',
    sensitive: false,
    description
  });

export const LogSecurityEvent = (description?: string) => 
  AuditLog({
    entity: 'USER',
    action: 'UPDATE',
    sensitive: true,
    description
  });

export const LogIntegrationEvent = (description?: string) => 
  AuditLog({
    entity: 'BUSINESS_METRIC',
    action: 'CREATE',
    sensitive: false,
    description
  });