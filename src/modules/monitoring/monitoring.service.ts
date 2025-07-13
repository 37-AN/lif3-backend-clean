import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: Date;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  integrations: {
    googleDrive: boolean;
    discord: boolean;
    claudeAI: boolean;
    websocket: boolean;
  };
  metrics: {
    activeUsers: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export interface AlertConfig {
  type: 'EMAIL' | 'SLACK' | 'DISCORD' | 'WEBHOOK';
  enabled: boolean;
  threshold: any;
  recipients: string[];
}

export interface LogAnalytics {
  timeframe: string;
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  financialTransactions: number;
  securityEvents: number;
  performanceMetrics: {
    averageResponseTime: number;
    slowestEndpoint: string;
    totalRequests: number;
  };
  userActivity: {
    activeUsers: number;
    topActions: string[];
  };
  businessMetrics: {
    revenueLogged: number;
    goalUpdates: number;
    netWorthChanges: number;
  };
}

@Injectable()
export class MonitoringService {
  private healthCheckInterval: NodeJS.Timeout;
  private logAnalyticsInterval: NodeJS.Timeout;
  private systemMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    responseTimeSum: 0,
    requestCount: 0,
    activeConnections: 0,
    lastHealthCheck: new Date()
  };

  constructor(private readonly logger: LoggerService) {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Log analytics every hour
    this.logAnalyticsInterval = setInterval(() => {
      this.analyzeLogsAndGenerateReport();
    }, 60 * 60 * 1000);

    this.logger.log('Monitoring service initialized', 'MonitoringService');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Mock database health check (replace with actual database ping)
      const dbStartTime = Date.now();
      const databaseConnected = await this.checkDatabaseHealth();
      const dbResponseTime = Date.now() - dbStartTime;

      // Check integration health
      const integrations = await this.checkIntegrationHealth();

      const health: SystemHealth = {
        status: this.calculateOverallStatus(databaseConnected, integrations),
        timestamp: new Date(),
        uptime,
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpu: {
          usage: await this.getCPUUsage()
        },
        database: {
          connected: databaseConnected,
          responseTime: dbResponseTime
        },
        integrations,
        metrics: {
          activeUsers: this.systemMetrics.activeConnections,
          totalRequests: this.systemMetrics.totalRequests,
          averageResponseTime: this.systemMetrics.requestCount > 0 
            ? this.systemMetrics.responseTimeSum / this.systemMetrics.requestCount 
            : 0,
          errorRate: this.systemMetrics.totalRequests > 0 
            ? (this.systemMetrics.totalErrors / this.systemMetrics.totalRequests) * 100 
            : 0
        }
      };

      const duration = Date.now() - startTime;

      this.logger.logPerformanceMetric('HEALTH_CHECK', duration, 'ms', 'MonitoringService');
      
      this.logger.log(`System health check completed: ${health.status}`, 'MonitoringService');

      return health;

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack, 'MonitoringService');
      
      return {
        status: 'CRITICAL',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { usage: 0 },
        database: { connected: false, responseTime: 0 },
        integrations: { googleDrive: false, discord: false, claudeAI: false, websocket: false },
        metrics: { activeUsers: 0, totalRequests: 0, averageResponseTime: 0, errorRate: 100 }
      };
    }
  }

  async analyzeLogsAndGenerateReport(timeframe: string = '1h'): Promise<LogAnalytics> {
    const startTime = Date.now();
    
    try {
      const logFiles = await this.getLogFiles();
      const analytics = await this.analyzeLogs(logFiles, timeframe);

      this.logger.log(`Log analytics completed for timeframe: ${timeframe}`, 'MonitoringService');
      
      // Generate report file
      await this.generateAnalyticsReport(analytics);

      const duration = Date.now() - startTime;
      this.logger.logPerformanceMetric('LOG_ANALYTICS', duration, 'ms', 'MonitoringService');

      return analytics;

    } catch (error) {
      this.logger.error(`Failed to analyze logs: ${error.message}`, error.stack, 'MonitoringService');
      throw error;
    }
  }

  async getFinancialMetrics(): Promise<any> {
    try {
      return {
        netWorthTracking: {
          current: 239625,
          target: 1800000,
          progress: 13.3,
          lastUpdate: new Date()
        },
        businessMetrics: {
          dailyRevenue: 0,
          dailyTarget: 4881,
          mrr: 0,
          mrrTarget: 147917
        },
        transactionMetrics: {
          dailyTransactions: 0,
          weeklyTransactions: 0,
          monthlyTransactions: 0,
          averageTransactionAmount: 0
        },
        goalMetrics: {
          totalGoals: 3,
          activeGoals: 3,
          completedGoals: 0,
          averageProgress: 13.3
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get financial metrics: ${error.message}`, error.stack, 'MonitoringService');
      throw error;
    }
  }

  async getSecurityMetrics(): Promise<any> {
    try {
      return {
        authenticationEvents: {
          successfulLogins: 0,
          failedLogins: 0,
          accountLockouts: 0,
          passwordChanges: 0
        },
        accessPatterns: {
          uniqueIPs: 0,
          suspiciousActivity: 0,
          blockedRequests: 0
        },
        dataAccess: {
          financialDataAccess: 0,
          sensitiveOperations: 0,
          auditTrailEntries: 0
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get security metrics: ${error.message}`, error.stack, 'MonitoringService');
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<any> {
    try {
      return {
        apiPerformance: {
          averageResponseTime: this.systemMetrics.requestCount > 0 
            ? this.systemMetrics.responseTimeSum / this.systemMetrics.requestCount 
            : 0,
          slowestEndpoints: [],
          totalRequests: this.systemMetrics.totalRequests,
          errorRate: this.systemMetrics.totalRequests > 0 
            ? (this.systemMetrics.totalErrors / this.systemMetrics.totalRequests) * 100 
            : 0
        },
        databasePerformance: {
          averageQueryTime: 50,
          slowQueries: 0,
          connectionPoolUsage: 75
        },
        systemResources: {
          memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
          cpuUsage: await this.getCPUUsage(),
          diskUsage: 45
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get performance metrics: ${error.message}`, error.stack, 'MonitoringService');
      throw error;
    }
  }

  incrementRequestCount() {
    this.systemMetrics.totalRequests++;
  }

  incrementErrorCount() {
    this.systemMetrics.totalErrors++;
  }

  addResponseTime(duration: number) {
    this.systemMetrics.responseTimeSum += duration;
    this.systemMetrics.requestCount++;
  }

  setActiveConnections(count: number) {
    this.systemMetrics.activeConnections = count;
  }

  private async performHealthCheck() {
    try {
      const health = await this.getSystemHealth();
      
      if (health.status === 'CRITICAL') {
        await this.sendAlert('CRITICAL', 'System health is critical', health);
      } else if (health.status === 'WARNING') {
        await this.sendAlert('WARNING', 'System health warning', health);
      }

      this.systemMetrics.lastHealthCheck = new Date();
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack, 'MonitoringService');
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Mock database health check
      // In production, this would ping the actual database
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkIntegrationHealth(): Promise<SystemHealth['integrations']> {
    try {
      return {
        googleDrive: await this.pingGoogleDrive(),
        discord: await this.pingDiscord(),
        claudeAI: await this.pingClaudeAI(),
        websocket: await this.pingWebSocket()
      };
    } catch (error) {
      return {
        googleDrive: false,
        discord: false,
        claudeAI: false,
        websocket: false
      };
    }
  }

  private async pingGoogleDrive(): Promise<boolean> {
    // Mock Google Drive health check
    return true;
  }

  private async pingDiscord(): Promise<boolean> {
    // Mock Discord health check
    return true;
  }

  private async pingClaudeAI(): Promise<boolean> {
    // Mock Claude AI health check
    return true;
  }

  private async pingWebSocket(): Promise<boolean> {
    // Mock WebSocket health check
    return true;
  }

  private async getCPUUsage(): Promise<number> {
    // Mock CPU usage calculation
    return Math.random() * 100;
  }

  private calculateOverallStatus(dbConnected: boolean, integrations: SystemHealth['integrations']): SystemHealth['status'] {
    if (!dbConnected) return 'CRITICAL';
    
    const memoryUsage = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;
    if (memoryUsage > 90) return 'CRITICAL';
    if (memoryUsage > 75) return 'WARNING';

    const integrationCount = Object.values(integrations).filter(Boolean).length;
    if (integrationCount < 2) return 'WARNING';

    return 'HEALTHY';
  }

  private async getLogFiles(): Promise<string[]> {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) return [];
      
      return fs.readdirSync(logDir).filter(file => file.endsWith('.log'));
    } catch (error) {
      return [];
    }
  }

  private async analyzeLogs(logFiles: string[], timeframe: string): Promise<LogAnalytics> {
    // Mock log analysis
    return {
      timeframe,
      totalLogs: 1500,
      errorCount: 12,
      warningCount: 45,
      financialTransactions: 23,
      securityEvents: 8,
      performanceMetrics: {
        averageResponseTime: 250,
        slowestEndpoint: '/api/financial/dashboard',
        totalRequests: 1200
      },
      userActivity: {
        activeUsers: 1,
        topActions: ['VIEW_DASHBOARD', 'ADD_TRANSACTION', 'CHECK_GOALS']
      },
      businessMetrics: {
        revenueLogged: 2400,
        goalUpdates: 5,
        netWorthChanges: 3
      }
    };
  }

  private async generateAnalyticsReport(analytics: LogAnalytics) {
    try {
      const reportContent = `# LIF3 Analytics Report - ${analytics.timeframe}

## Summary
- Total Logs: ${analytics.totalLogs}
- Errors: ${analytics.errorCount}
- Warnings: ${analytics.warningCount}
- Financial Transactions: ${analytics.financialTransactions}

## Performance
- Average Response Time: ${analytics.performanceMetrics.averageResponseTime}ms
- Total Requests: ${analytics.performanceMetrics.totalRequests}
- Slowest Endpoint: ${analytics.performanceMetrics.slowestEndpoint}

## Business Metrics
- Revenue Logged: R${analytics.businessMetrics.revenueLogged}
- Goal Updates: ${analytics.businessMetrics.goalUpdates}
- Net Worth Changes: ${analytics.businessMetrics.netWorthChanges}

## User Activity
- Active Users: ${analytics.userActivity.activeUsers}
- Top Actions: ${analytics.userActivity.topActions.join(', ')}

Generated: ${new Date().toISOString()}
`;

      const reportPath = path.join(process.cwd(), 'logs', `analytics_${Date.now()}.md`);
      fs.writeFileSync(reportPath, reportContent);

      this.logger.log(`Analytics report generated: ${reportPath}`, 'MonitoringService');
    } catch (error) {
      this.logger.error(`Failed to generate analytics report: ${error.message}`, error.stack, 'MonitoringService');
    }
  }

  private async sendAlert(level: string, message: string, data: any) {
    try {
      this.logger.log(`ALERT [${level}]: ${message}`, 'MonitoringService');
      
      // In production, this would send alerts via email, Slack, Discord, etc.
      // For now, just log the alert
      console.warn(`🚨 ALERT [${level}]: ${message}`, data);
    } catch (error) {
      this.logger.error(`Failed to send alert: ${error.message}`, error.stack, 'MonitoringService');
    }
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.logAnalyticsInterval) {
      clearInterval(this.logAnalyticsInterval);
    }
  }
}