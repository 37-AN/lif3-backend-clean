import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || null;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - now;
        const statusCode = response.statusCode;

        this.logger.logAPIAccess(
          method,
          url,
          userId,
          statusCode,
          duration,
          ip
        );

        if (url.includes('/financial/') || url.includes('/transactions/') || url.includes('/accounts/')) {
          this.logger.logFinancialAudit({
            userId: userId || 'anonymous',
            action: 'VIEW',
            entity: this.getEntityFromUrl(url),
            currency: 'ZAR',
            ipAddress: ip,
            userAgent,
            timestamp: new Date(),
            metadata: { endpoint: url, method, statusCode, duration }
          });
        }

        if (url.includes('/auth/') || url.includes('/login') || url.includes('/register')) {
          this.logger.logSecurityEvent({
            userId: userId || 'anonymous',
            action: this.getSecurityActionFromUrl(url, method),
            ipAddress: ip,
            userAgent,
            timestamp: new Date(),
            riskLevel: this.calculateRiskLevel(url, method, statusCode),
            metadata: { endpoint: url, method, statusCode, duration }
          });
        }

        if (url.includes('/business/') || url.includes('/43v3r/')) {
          this.logger.logBusinessMetric({
            metric: this.getBusinessMetricFromUrl(url),
            value: data?.value || 0,
            currency: 'ZAR',
            timestamp: new Date(),
            source: 'MANUAL',
            metadata: { endpoint: url, method, statusCode, duration }
          });
        }

        if (duration > 5000) {
          this.logger.logPerformanceMetric(
            'SLOW_REQUEST',
            duration,
            'ms',
            `${method} ${url}`
          );
        }
      })
    );
  }

  private getEntityFromUrl(url: string): 'TRANSACTION' | 'ACCOUNT' | 'GOAL' | 'BALANCE' {
    if (url.includes('/transactions')) return 'TRANSACTION';
    if (url.includes('/accounts')) return 'ACCOUNT';
    if (url.includes('/goals')) return 'GOAL';
    if (url.includes('/balance')) return 'BALANCE';
    return 'TRANSACTION';
  }

  private getSecurityActionFromUrl(url: string, method: string): 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE' | 'PERMISSION_DENIED' {
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/logout')) return 'LOGOUT';
    if (url.includes('/register')) return 'REGISTER';
    if (url.includes('/password') && method === 'PUT') return 'PASSWORD_CHANGE';
    return 'PERMISSION_DENIED';
  }

  private getBusinessMetricFromUrl(url: string): '43V3R_REVENUE' | '43V3R_MRR' | '43V3R_CUSTOMERS' | '43V3R_PIPELINE' | 'NET_WORTH_PROGRESS' | 'GOAL_MILESTONE' {
    if (url.includes('/revenue')) return '43V3R_REVENUE';
    if (url.includes('/mrr')) return '43V3R_MRR';
    if (url.includes('/customers')) return '43V3R_CUSTOMERS';
    if (url.includes('/pipeline')) return '43V3R_PIPELINE';
    if (url.includes('/net-worth')) return 'NET_WORTH_PROGRESS';
    return 'GOAL_MILESTONE';
  }

  private calculateRiskLevel(url: string, method: string, statusCode: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (statusCode >= 400) return 'HIGH';
    if (url.includes('/admin/')) return 'HIGH';
    if (url.includes('/financial/') && method !== 'GET') return 'MEDIUM';
    return 'LOW';
  }
}