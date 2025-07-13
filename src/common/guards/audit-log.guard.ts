import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private logger: LoggerService
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const auditLogOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditLogOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers, user, body, params } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = user?.id || 'anonymous';

    this.logger.logFinancialAudit({
      userId,
      action: auditLogOptions.action,
      entity: auditLogOptions.entity,
      entityId: params?.id || body?.id,
      amount: body?.amount || body?.value,
      currency: body?.currency || 'ZAR',
      ipAddress: ip,
      userAgent,
      timestamp: new Date(),
      metadata: {
        endpoint: url,
        method,
        description: auditLogOptions.description,
        sensitive: auditLogOptions.sensitive,
        requestBody: auditLogOptions.sensitive ? '[REDACTED]' : body,
        params: auditLogOptions.sensitive ? '[REDACTED]' : params,
      }
    });

    return true;
  }
}