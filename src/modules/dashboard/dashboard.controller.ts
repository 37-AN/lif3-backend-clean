import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { 
  DeploymentStatus, 
  GitHubEventsResponse, 
  WebhookResponse, 
  DeploymentLogsResponse, 
  StatusOverviewResponse 
} from './dashboard.types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('deployments')
  async getDeploymentStatus(): Promise<DeploymentStatus> {
    return this.dashboardService.getDeploymentStatus();
  }

  @Get('github-events')
  async getGitHubEvents(@Query('limit') limit?: string): Promise<GitHubEventsResponse> {
    return this.dashboardService.getGitHubEvents(limit ? parseInt(limit) : 20);
  }

  @Post('webhooks/github')
  async handleGitHubWebhook(@Body() payload: any): Promise<WebhookResponse> {
    return this.dashboardService.handleGitHubWebhook(payload);
  }

  @Post('webhooks/render')
  async handleRenderWebhook(@Body() payload: any): Promise<WebhookResponse> {
    return this.dashboardService.handleRenderWebhook(payload);
  }

  @Post('webhooks/vercel')
  async handleVercelWebhook(@Body() payload: any): Promise<WebhookResponse> {
    return this.dashboardService.handleVercelWebhook(payload);
  }

  @Get('notifications/test')
  async testNotifications(): Promise<WebhookResponse> {
    return this.dashboardService.testNotifications();
  }

  @Get('logs/deployment')
  async getDeploymentLogs(@Query('service') service?: string): Promise<DeploymentLogsResponse> {
    return this.dashboardService.getDeploymentLogs(service);
  }

  @Get('status/overview')
  async getStatusOverview(): Promise<StatusOverviewResponse> {
    return this.dashboardService.getStatusOverview();
  }
}