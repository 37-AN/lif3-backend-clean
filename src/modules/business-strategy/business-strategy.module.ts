import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BusinessStrategyService } from './business-strategy.service';
import { BusinessStrategyController } from './business-strategy.controller';

@Module({
  imports: [ConfigModule],
  providers: [BusinessStrategyService],
  controllers: [BusinessStrategyController],
  exports: [BusinessStrategyService]
})
export class BusinessStrategyModule {} 