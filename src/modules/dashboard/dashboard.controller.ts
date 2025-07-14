import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('deployments')
  async getDeploymentStatus() {
    return this.dashboardService.getDeploymentStatus();
  }

  @Get('github-events')
  async getGitHubEvents(@Query('limit') limit?: string) {
    return this.dashboardService.getGitHubEvents(limit ? parseInt(limit) : 20);
  }

  @Post('webhooks/github')
  async handleGitHubWebhook(@Body() payload: any) {
    return this.dashboardService.handleGitHubWebhook(payload);
  }

  @Post('webhooks/render')
  async handleRenderWebhook(@Body() payload: any) {
    return this.dashboardService.handleRenderWebhook(payload);
  }

  @Post('webhooks/vercel')
  async handleVercelWebhook(@Body() payload: any) {
    return this.dashboardService.handleVercelWebhook(payload);
  }

  @Get('notifications/test')
  async testNotifications() {
    return this.dashboardService.testNotifications();
  }

  @Get('logs/deployment')
  async getDeploymentLogs(@Query('service') service?: string) {
    return this.dashboardService.getDeploymentLogs(service);
  }

  @Get('status/overview')
  async getStatusOverview() {
    return this.dashboardService.getStatusOverview();
  }
}