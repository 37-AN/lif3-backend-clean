import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';
import { 
  DeploymentEvent, 
  NotificationConfig, 
  DeploymentStatus, 
  GitHubEventsResponse, 
  WebhookResponse, 
  DeploymentLogsResponse, 
  StatusOverviewResponse,
  ServiceStatus
} from './dashboard.types';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private deploymentEvents: DeploymentEvent[] = [];
  private notificationConfig: NotificationConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService
  ) {
    this.initializeNotificationConfig();
    this.loadDeploymentHistory();
  }

  private initializeNotificationConfig() {
    this.notificationConfig = {
      discord: {
        enabled: !!this.configService.get('DISCORD_WEBHOOK_URL'),
        webhookUrl: this.configService.get('DISCORD_WEBHOOK_URL') || ''
      },
      slack: {
        enabled: !!this.configService.get('SLACK_WEBHOOK_URL'),
        webhookUrl: this.configService.get('SLACK_WEBHOOK_URL') || ''
      }
    };
  }

  async getDeploymentStatus(): Promise<DeploymentStatus> {
    try {
      // Get current deployment status from services
      const renderStatus = await this.checkRenderStatus();
      const vercelStatus = await this.checkVercelStatus();
      const githubStatus = await this.checkGitHubStatus();

      return {
        timestamp: new Date(),
        services: {
          render: renderStatus,
          vercel: vercelStatus,
          github: githubStatus
        },
        recentEvents: this.deploymentEvents.slice(-10)
      };
    } catch (error) {
      this.logger.error(`Failed to get deployment status: ${error.message}`);
      throw error;
    }
  }

  async getGitHubEvents(limit: number = 20): Promise<GitHubEventsResponse> {
    try {
      // Filter GitHub events from deployment history
      const githubEvents = this.deploymentEvents
        .filter(event => event.service === 'github')
        .slice(-limit);

      return {
        events: githubEvents,
        total: githubEvents.length,
        lastUpdate: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to get GitHub events: ${error.message}`);
      throw error;
    }
  }

  async handleGitHubWebhook(payload: any): Promise<WebhookResponse> {
    try {
      const event: DeploymentEvent = {
        id: `github_${Date.now()}`,
        timestamp: new Date(),
        service: 'github',
        event: payload.action || 'push',
        status: 'success',
        branch: payload.ref?.replace('refs/heads/', '') || 'unknown',
        commit: payload.head_commit?.id?.substring(0, 7) || 'unknown',
        message: payload.head_commit?.message || 'GitHub event',
        url: payload.head_commit?.url
      };

      this.addDeploymentEvent(event);
      await this.sendNotifications(event);

      this.logger.log(`GitHub webhook processed: ${event.event} on ${event.branch}`);
      return { status: 'processed', event };
    } catch (error) {
      this.logger.error(`Failed to handle GitHub webhook: ${error.message}`);
      throw error;
    }
  }

  async handleRenderWebhook(payload: any): Promise<WebhookResponse> {
    try {
      const event: DeploymentEvent = {
        id: `render_${Date.now()}`,
        timestamp: new Date(),
        service: 'render',
        event: payload.type || 'deployment',
        status: this.mapRenderStatus(payload.status),
        branch: payload.branch || 'main',
        commit: payload.commit?.substring(0, 7) || 'unknown',
        message: `Render deployment ${payload.status}`,
        url: payload.deploymentUrl,
        duration: payload.duration
      };

      this.addDeploymentEvent(event);
      await this.sendNotifications(event);

      this.logger.log(`Render webhook processed: ${event.status} deployment`);
      return { status: 'processed', event };
    } catch (error) {
      this.logger.error(`Failed to handle Render webhook: ${error.message}`);
      throw error;
    }
  }

  async handleVercelWebhook(payload: any): Promise<WebhookResponse> {
    try {
      const event: DeploymentEvent = {
        id: `vercel_${Date.now()}`,
        timestamp: new Date(),
        service: 'vercel',
        event: payload.type || 'deployment',
        status: this.mapVercelStatus(payload.status),
        branch: payload.target || 'main',
        commit: payload.meta?.githubCommitSha?.substring(0, 7) || 'unknown',
        message: `Vercel deployment ${payload.status}`,
        url: payload.url,
        duration: payload.duration
      };

      this.addDeploymentEvent(event);
      await this.sendNotifications(event);

      this.logger.log(`Vercel webhook processed: ${event.status} deployment`);
      return { status: 'processed', event };
    } catch (error) {
      this.logger.error(`Failed to handle Vercel webhook: ${error.message}`);
      throw error;
    }
  }

  async testNotifications(): Promise<WebhookResponse> {
    const testEvent: DeploymentEvent = {
      id: `test_${Date.now()}`,
      timestamp: new Date(),
      service: 'github',
      event: 'test',
      status: 'success',
      branch: 'main',
      commit: 'abc1234',
      message: 'Test notification from LIF3 dashboard'
    };

    await this.sendNotifications(testEvent);
    return { status: 'sent', event: testEvent };
  }

  async getDeploymentLogs(service?: string): Promise<DeploymentLogsResponse> {
    try {
      let events = this.deploymentEvents;
      
      if (service) {
        events = events.filter(event => event.service === service);
      }

      return {
        logs: events.slice(-50), // Last 50 events
        total: events.length,
        services: ['render', 'vercel', 'github'],
        lastUpdate: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to get deployment logs: ${error.message}`);
      throw error;
    }
  }

  async getStatusOverview(): Promise<StatusOverviewResponse> {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recent = this.deploymentEvents.filter(
        event => event.timestamp > last24h
      );

      const stats = {
        total: recent.length,
        successful: recent.filter(e => e.status === 'success').length,
        failed: recent.filter(e => e.status === 'failed').length,
        pending: recent.filter(e => e.status === 'pending').length
      };

      return {
        period: '24h',
        statistics: stats,
        successRate: stats.total > 0 ? (stats.successful / stats.total * 100).toFixed(2) : 0,
        services: {
          render: recent.filter(e => e.service === 'render').length,
          vercel: recent.filter(e => e.service === 'vercel').length,
          github: recent.filter(e => e.service === 'github').length
        },
        lastDeployment: this.deploymentEvents[this.deploymentEvents.length - 1],
        notifications: this.notificationConfig
      };
    } catch (error) {
      this.logger.error(`Failed to get status overview: ${error.message}`);
      throw error;
    }
  }

  private addDeploymentEvent(event: DeploymentEvent) {
    this.deploymentEvents.push(event);
    
    // Keep only last 500 events to prevent memory issues
    if (this.deploymentEvents.length > 500) {
      this.deploymentEvents = this.deploymentEvents.slice(-500);
    }

    this.saveDeploymentHistory();
  }

  private async sendNotifications(event: DeploymentEvent) {
    const promises = [];

    if (this.notificationConfig.discord.enabled) {
      promises.push(this.sendDiscordNotification(event));
    }

    if (this.notificationConfig.slack.enabled) {
      promises.push(this.sendSlackNotification(event));
    }

    await Promise.allSettled(promises);
  }

  private async sendDiscordNotification(event: DeploymentEvent) {
    try {
      const color = this.getStatusColor(event.status);
      const embed = {
        title: `🚀 LIF3 Deployment: ${event.service.toUpperCase()}`,
        description: event.message,
        color: color,
        fields: [
          { name: 'Status', value: event.status.toUpperCase(), inline: true },
          { name: 'Branch', value: event.branch, inline: true },
          { name: 'Commit', value: event.commit, inline: true },
          { name: 'Service', value: event.service, inline: true },
          { name: 'Event', value: event.event, inline: true },
          { name: 'Time', value: event.timestamp.toISOString(), inline: true }
        ],
        timestamp: event.timestamp.toISOString()
      };

      if (event.url) {
        embed['url'] = event.url;
      }

      const response = await fetch(this.notificationConfig.discord.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }

      this.logger.log('Discord notification sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send Discord notification: ${error.message}`);
    }
  }

  private async sendSlackNotification(event: DeploymentEvent) {
    try {
      const color = this.getStatusColor(event.status);
      const attachment = {
        color: color === 0x00ff00 ? 'good' : color === 0xff0000 ? 'danger' : 'warning',
        title: `🚀 LIF3 Deployment: ${event.service.toUpperCase()}`,
        text: event.message,
        fields: [
          { title: 'Status', value: event.status.toUpperCase(), short: true },
          { title: 'Branch', value: event.branch, short: true },
          { title: 'Commit', value: event.commit, short: true },
          { title: 'Service', value: event.service, short: true }
        ],
        ts: Math.floor(event.timestamp.getTime() / 1000)
      };

      if (event.url) {
        attachment['title_link'] = event.url;
      }

      const response = await fetch(this.notificationConfig.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments: [attachment] })
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      this.logger.log('Slack notification sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send Slack notification: ${error.message}`);
    }
  }

  private getStatusColor(status: string): number {
    switch (status) {
      case 'success': return 0x00ff00; // Green
      case 'failed': return 0xff0000;  // Red
      case 'pending': return 0xffff00; // Yellow
      default: return 0x808080;        // Gray
    }
  }

  private mapRenderStatus(status: string): 'success' | 'failed' | 'pending' | 'cancelled' {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'deployed':
      case 'ready': return 'success';
      case 'failed':
      case 'error': return 'failed';
      case 'building':
      case 'deploying': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  private mapVercelStatus(status: string): 'success' | 'failed' | 'pending' | 'cancelled' {
    switch (status?.toUpperCase()) {
      case 'READY': return 'success';
      case 'ERROR': return 'failed';
      case 'BUILDING':
      case 'QUEUED': return 'pending';
      case 'CANCELLED': return 'cancelled';
      default: return 'pending';
    }
  }

  private async checkRenderStatus() {
    // Mock Render status check - in production, use Render API
    return {
      status: 'healthy',
      lastDeployment: new Date(),
      url: 'https://lif3-backend-clean.onrender.com'
    };
  }

  private async checkVercelStatus() {
    // Mock Vercel status check - in production, use Vercel API  
    return {
      status: 'healthy',
      lastDeployment: new Date(),
      url: 'https://your-app.vercel.app'
    };
  }

  private async checkGitHubStatus() {
    // Mock GitHub status check - in production, use GitHub API
    return {
      status: 'healthy',
      lastCommit: new Date(),
      repository: 'https://github.com/37-AN/l1f3'
    };
  }

  private saveDeploymentHistory() {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const filePath = path.join(logsDir, 'deployment-events.json');
      fs.writeFileSync(filePath, JSON.stringify(this.deploymentEvents, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save deployment history: ${error.message}`);
    }
  }

  private loadDeploymentHistory() {
    try {
      const filePath = path.join(process.cwd(), 'logs', 'deployment-events.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.deploymentEvents = JSON.parse(data).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        this.logger.log(`Loaded ${this.deploymentEvents.length} deployment events from history`);
      }
    } catch (error) {
      this.logger.error(`Failed to load deployment history: ${error.message}`);
      this.deploymentEvents = [];
    }
  }
}