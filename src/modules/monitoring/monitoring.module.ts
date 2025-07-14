import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { ResourceMonitorService } from './resource-monitor.service';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, ResourceMonitorService],
  exports: [MonitoringService, ResourceMonitorService],
})
export class MonitoringModule {}