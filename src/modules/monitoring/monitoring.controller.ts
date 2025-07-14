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
    return this.monitoringService.getHealthMetrics();
  }

  @Post('logs/frontend')
  async logFrontendEvent(@Body() logData: any) {
    return this.monitoringService.logEvent('frontend', logData);
  }

  @Post('logs/errors')
  async logError(@Body() errorData: any) {
    return this.monitoringService.logEvent('error', errorData);
  }

  @Post('logs/performance')
  async logPerformance(@Body() perfData: any) {
    return this.monitoringService.logEvent('performance', perfData);
  }
}