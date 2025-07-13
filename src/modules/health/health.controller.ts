import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return await this.healthService.checkHealth();
  }

  @Get('detailed')
  async getDetailedHealth() {
    return await this.healthService.checkDetailedHealth();
  }

  @Get('connections')
  async getConnectionStatus() {
    return await this.healthService.checkConnectionStatus();
  }
}