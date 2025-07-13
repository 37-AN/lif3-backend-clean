import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Client as DiscordClient, GatewayIntentBits } from 'discord.js';
import Anthropic from '@anthropic-ai/sdk';
import { AppDataSource } from '../database/data-source';
import Redis from 'ioredis';

interface ConnectionTestResult {
  service: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  details?: any;
}

class ConnectionTester {
  private results: ConnectionTestResult[] = [];
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  async testDatabaseConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing PostgreSQL database connection...');
      
      await AppDataSource.initialize();
      const result = await AppDataSource.query('SELECT NOW()');
      await AppDataSource.destroy();

      return {
        service: 'PostgreSQL Database',
        status: 'success',
        message: 'Database connection successful',
        details: { timestamp: result[0].now }
      };
    } catch (error) {
      return {
        service: 'PostgreSQL Database',
        status: 'failed',
        message: `Database connection failed: ${error.message}`
      };
    }
  }

  async testRedisConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing Redis cache connection...');
      
      const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
      const redis = new Redis(redisUrl);
      await redis.set('lif3:test', 'connection-test');
      const value = await redis.get('lif3:test');
      await redis.del('lif3:test');
      await redis.quit();

      return {
        service: 'Redis Cache',
        status: 'success',
        message: 'Redis connection successful',
        details: { testValue: value }
      };
    } catch (error) {
      return {
        service: 'Redis Cache',
        status: 'failed',
        message: `Redis connection failed: ${error.message}`
      };
    }
  }

  async testGoogleDriveConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing Google Drive API connection...');
      
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        return {
          service: 'Google Drive API',
          status: 'skipped',
          message: 'Google Drive credentials not configured'
        };
      }

      const auth = new google.auth.OAuth2(clientId, clientSecret);
      const drive = google.drive({ version: 'v3', auth });

      // Test with a simple API call
      const response = await drive.about.get({ fields: 'user' });

      return {
        service: 'Google Drive API',
        status: 'success',
        message: 'Google Drive API accessible',
        details: { user: response.data.user }
      };
    } catch (error) {
      return {
        service: 'Google Drive API',
        status: 'failed',
        message: `Google Drive connection failed: ${error.message}`
      };
    }
  }

  async testDiscordBotConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing Discord Bot connection...');
      
      const token = this.configService.get('DISCORD_BOT_TOKEN');

      if (!token) {
        return {
          service: 'Discord Bot',
          status: 'skipped',
          message: 'Discord bot token not configured'
        };
      }

      const client = new DiscordClient({
        intents: [GatewayIntentBits.Guilds]
      });

      await client.login(token);
      
      const botUser = client.user;
      await client.destroy();

      return {
        service: 'Discord Bot',
        status: 'success',
        message: 'Discord bot connection successful',
        details: { 
          botName: botUser?.username,
          botId: botUser?.id
        }
      };
    } catch (error) {
      return {
        service: 'Discord Bot',
        status: 'failed',
        message: `Discord bot connection failed: ${error.message}`
      };
    }
  }

  async testClaudeAIConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing Claude AI API connection...');
      
      const apiKey = this.configService.get('CLAUDE_API_KEY');

      if (!apiKey) {
        return {
          service: 'Claude AI API',
          status: 'skipped',
          message: 'Claude AI API key not configured'
        };
      }

      const client = new Anthropic({
        apiKey: apiKey
      });

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test connection' }]
      });

      return {
        service: 'Claude AI API',
        status: 'success',
        message: 'Claude AI API connection successful',
        details: {
          model: response.model,
          usage: response.usage
        }
      };
    } catch (error) {
      return {
        service: 'Claude AI API',
        status: 'failed',
        message: `Claude AI connection failed: ${error.message}`
      };
    }
  }

  async testLunoConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing Luno API connection...');
      
      const apiKey = this.configService.get('LUNO_API_KEY');
      const apiSecret = this.configService.get('LUNO_API_SECRET');

      if (!apiKey || !apiSecret) {
        return {
          service: 'Luno API',
          status: 'skipped',
          message: 'Luno API credentials not configured'
        };
      }

      // Simple ticker test
      const response = await fetch('https://api.luno.com/api/1/ticker?pair=XBTZAR');
      const data = await response.json();

      return {
        service: 'Luno API',
        status: 'success',
        message: 'Luno API connection successful',
        details: {
          pair: 'XBT/ZAR',
          lastTrade: data.last_trade
        }
      };
    } catch (error) {
      return {
        service: 'Luno API',
        status: 'failed',
        message: `Luno API connection failed: ${error.message}`
      };
    }
  }

  async testSMTPConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing SMTP email connection...');
      
      const host = this.configService.get('SMTP_HOST');
      const user = this.configService.get('SMTP_USER');
      const pass = this.configService.get('SMTP_PASS');

      if (!host || !user || !pass) {
        return {
          service: 'SMTP Email',
          status: 'skipped',
          message: 'SMTP credentials not configured'
        };
      }

      // Test SMTP connection without sending email
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: host,
        port: this.configService.get('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: user,
          pass: pass
        }
      });

      await transporter.verify();

      return {
        service: 'SMTP Email',
        status: 'success',
        message: 'SMTP connection successful',
        details: { host, user }
      };
    } catch (error) {
      return {
        service: 'SMTP Email',
        status: 'failed',
        message: `SMTP connection failed: ${error.message}`
      };
    }
  }

  async runAllTests(): Promise<ConnectionTestResult[]> {
    console.log('🚀 Starting LIF3 API Connection Tests...');
    console.log('='.repeat(50));

    const tests = [
      this.testDatabaseConnection(),
      this.testRedisConnection(),
      this.testGoogleDriveConnection(),
      this.testDiscordBotConnection(),
      this.testClaudeAIConnection(),
      this.testLunoConnection(),
      this.testSMTPConnection()
    ];

    this.results = await Promise.all(tests);
    this.displayResults();
    return this.results;
  }

  private displayResults(): void {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 CONNECTION TEST RESULTS');
    console.log('='.repeat(50));

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'failed' ? '❌' : '⏭️';
      
      console.log(`${icon} ${result.service}: ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }

      switch (result.status) {
        case 'success': successCount++; break;
        case 'failed': failureCount++; break;
        case 'skipped': skippedCount++; break;
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📈 Total: ${this.results.length}`);

    if (failureCount > 0) {
      console.log('\n⚠️  Some connections failed. Check your environment configuration.');
      console.log('   Run: npm run setup:keys to reconfigure API keys');
    } else if (successCount > 0) {
      console.log('\n🎉 All configured services are working correctly!');
      console.log('   Ready to start your fresh start journey: R0 → R1,800,000');
    }

    console.log('='.repeat(50));
  }

  getFailedConnections(): ConnectionTestResult[] {
    return this.results.filter(r => r.status === 'failed');
  }

  getSuccessfulConnections(): ConnectionTestResult[] {
    return this.results.filter(r => r.status === 'success');
  }
}

// Export for use in tests and health checks
export { ConnectionTester, ConnectionTestResult };

// Run tests if called directly
if (require.main === module) {
  const tester = new ConnectionTester();
  tester.runAllTests()
    .then(results => {
      const failedCount = results.filter(r => r.status === 'failed').length;
      process.exit(failedCount > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Connection tests failed:', error);
      process.exit(1);
    });
}