import { Controller, Get, Post, Body } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { ResourceMonitorService } from './resource-monitor.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly resourceMonitorService: ResourceMonitorService
  ) {}

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

  @Get('resources')
  async getResourceStatus() {
    return this.resourceMonitorService.getResourceStatus();
  }

  @Get('resources/usage')
  async getResourceUsage() {
    return this.resourceMonitorService.monitorResources();
  }

  @Get('resources/report')
  async getResourceReport() {
    return this.resourceMonitorService.reportResourceUsage();
  }
}