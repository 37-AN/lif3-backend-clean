import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessStrategyService } from './business-strategy.service';
import { BusinessStrategyDto } from './business-strategy.dto';
import { BusinessStrategy } from './business-strategy.interface';

@Controller('business-strategy')
export class BusinessStrategyController {
  constructor(private readonly strategyService: BusinessStrategyService) {}

  @Get()
  async getStrategy() {
    const strategy = await this.strategyService.getStrategy();
    if (!strategy) {
      throw new HttpException('No business strategy found', HttpStatus.NOT_FOUND);
    }
    return strategy;
  }

  @Post()
  async updateStrategy(@Body() data: BusinessStrategyDto) {
    const ok = await this.strategyService.updateStrategy(data as BusinessStrategy);
    if (!ok) {
      throw new HttpException('Failed to update business strategy', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    // Call MCP sync placeholder
    await this.strategyService.syncToMCP(data as BusinessStrategy);
    return { success: true };
  }
} 