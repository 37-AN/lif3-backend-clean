import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface FinancialAuditLog {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  entity: 'TRANSACTION' | 'ACCOUNT' | 'GOAL' | 'BALANCE' | 'BUSINESS_METRIC' | 'USER';
  entityId?: string;
  amount?: number;
  currency: 'ZAR' | 'USD';
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: any;
}

export interface SecurityAuditLog {
  userId?: string;
  action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'REGISTER' | 'PASSWORD_CHANGE' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'PERMISSION_DENIED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: any;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BusinessMetricLog {
  metric: '43V3R_REVENUE' | '43V3R_MRR' | '43V3R_CUSTOMERS' | '43V3R_PIPELINE' | 'NET_WORTH_PROGRESS' | 'GOAL_MILESTONE';
  value: number;
  currency: 'ZAR' | 'USD';
  previousValue?: number;
  changePercent?: number;
  timestamp: Date;
  source: 'MANUAL' | 'AUTOMATED' | 'INTEGRATION';
  metadata?: any;
}

export interface IntegrationLog {
  service: 'GOOGLE_DRIVE' | 'DISCORD' | 'CLAUDE_AI' | 'BANK_API' | 'WEBSOCKET' | 'RAG_CHROMADB' | 'RAG_AI';
  action: 'CONNECT' | 'DISCONNECT' | 'SYNC' | 'ERROR' | 'RATE_LIMIT' | 'AUTHENTICATION_FAILED' | 'COMMAND_RECEIVED' | 'COMMAND_COMPLETED' | 'COMMAND_FAILED' | 'INITIALIZE' | 'PROCESS_DOCUMENT' | 'SEMANTIC_SEARCH' | 'GENERATE_RESPONSE' | 'ANALYZE_DOCUMENT' | 'DELETE_DOCUMENT';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PROCESSING';
  duration?: number;
  recordsProcessed?: number;
  errorMessage?: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  logFinancialAudit(auditLog: FinancialAuditLog) {
    this.logger.info('FINANCIAL_AUDIT', {
      type: 'FINANCIAL_AUDIT',
      ...auditLog,
    });
  }

  logSecurityEvent(securityLog: SecurityAuditLog) {
    this.logger.info('SECURITY_AUDIT', {
      type: 'SECURITY_AUDIT',
      ...securityLog,
    });
  }

  logBusinessMetric(metricLog: BusinessMetricLog) {
    this.logger.info('BUSINESS_METRIC', {
      type: 'BUSINESS_METRIC',
      ...metricLog,
    });
  }

  logIntegration(integrationLog: IntegrationLog) {
    this.logger.info('INTEGRATION', {
      type: 'INTEGRATION',
      ...integrationLog,
    });
  }

  logWebSocketEvent(event: string, data: any, userId?: string) {
    this.logger.info('WEBSOCKET_EVENT', {
      type: 'WEBSOCKET_EVENT',
      event,
      userId,
      data,
      timestamp: new Date(),
    });
  }

  logAPIAccess(method: string, endpoint: string, userId?: string, statusCode?: number, duration?: number, ipAddress?: string) {
    this.logger.info('API_ACCESS', {
      type: 'API_ACCESS',
      method,
      endpoint,
      userId,
      statusCode,
      duration,
      ipAddress,
      timestamp: new Date(),
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context?: string) {
    this.logger.info('PERFORMANCE_METRIC', {
      type: 'PERFORMANCE_METRIC',
      metric,
      value,
      unit,
      context,
      timestamp: new Date(),
    });
  }

  logZARCurrencyOperation(operation: string, amount: number, fromCurrency?: string, exchangeRate?: number, userId?: string) {
    this.logger.info('ZAR_CURRENCY_OPERATION', {
      type: 'ZAR_CURRENCY_OPERATION',
      operation,
      amount,
      fromCurrency,
      exchangeRate,
      userId,
      timestamp: new Date(),
    });
  }

  logGoalProgress(goalId: string, userId: string, currentAmount: number, targetAmount: number, progressPercent: number) {
    this.logger.info('GOAL_PROGRESS', {
      type: 'GOAL_PROGRESS',
      goalId,
      userId,
      currentAmount,
      targetAmount,
      progressPercent,
      timestamp: new Date(),
    });
  }

  logNetWorthUpdate(userId: string, previousNetWorth: number, newNetWorth: number, changeAmount: number, changePercent: number) {
    this.logger.info('NET_WORTH_UPDATE', {
      type: 'NET_WORTH_UPDATE',
      userId,
      previousNetWorth,
      newNetWorth,
      changeAmount,
      changePercent,
      timestamp: new Date(),
    });
  }

  log43V3RRevenue(amount: number, source: string, description?: string) {
    this.logger.info('43V3R_REVENUE', {
      type: '43V3R_REVENUE',
      amount,
      currency: 'ZAR',
      source,
      description,
      timestamp: new Date(),
    });
  }

  logDailyRevenueTarget(currentRevenue: number, targetRevenue: number = 4881, achievementPercent: number) {
    this.logger.info('DAILY_REVENUE_TARGET', {
      type: 'DAILY_REVENUE_TARGET',
      currentRevenue,
      targetRevenue,
      achievementPercent,
      timestamp: new Date(),
    });
  }

  logMRRProgress(currentMRR: number, targetMRR: number = 147917, progressPercent: number) {
    this.logger.info('MRR_PROGRESS', {
      type: 'MRR_PROGRESS',
      currentMRR,
      targetMRR,
      progressPercent,
      timestamp: new Date(),
    });
  }
}