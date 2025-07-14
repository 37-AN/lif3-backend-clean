import { Controller, Get, Post, Body } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('performance')
  async getPerformanceMetrics() {
    return this.monitoringService.getPerformanceMetrics();
  }

  @Get('health')
  async getHealthMetrics() {
    return this.monitoringService.getSystemHealth();
  }

  @Post('logs/frontend')
  async logFrontendEvent(@Body() logData: any) {
    // Simple acknowledgment for frontend logs
    return { status: 'logged', type: 'frontend', timestamp: new Date() };
  }

  @Post('logs/errors')
  async logError(@Body() errorData: any) {
    // Simple acknowledgment for error logs
    return { status: 'logged', type: 'error', timestamp: new Date() };
  }

  @Post('logs/performance')
  async logPerformance(@Body() perfData: any) {
    // Simple acknowledgment for performance logs
    return { status: 'logged', type: 'performance', timestamp: new Date() };
  }
}