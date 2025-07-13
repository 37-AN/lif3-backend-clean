import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionTester } from '../../scripts/test-connections';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  async checkHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      timezone: this.configService.get('TZ', 'Africa/Johannesburg'),
      freshStart: {
        netWorth: 'R0 → R1,800,000',
        business: '43V3R R0 → R4,881 daily',
        journey: 'Fresh Start Automation Active'
      }
    };
  }

  async checkDetailedHealth() {
    const basic = await this.checkHealth();
    
    return {
      ...basic,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      },
      configuration: {
        database: !!this.configService.get('DATABASE_URL'),
        redis: !!this.configService.get('REDIS_URL'),
        googleDrive: !!this.configService.get('GOOGLE_CLIENT_ID'),
        discord: !!this.configService.get('DISCORD_BOT_TOKEN'),
        claude: !!this.configService.get('CLAUDE_API_KEY'),
        email: !!this.configService.get('SMTP_USER')
      }
    };
  }

  async checkConnectionStatus() {
    const tester = new ConnectionTester();
    const results = await tester.runAllTests();
    
    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    };

    return {
      summary,
      connections: results,
      overall: summary.failed === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    };
  }
}