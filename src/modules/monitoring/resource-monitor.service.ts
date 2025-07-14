import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ResourceMonitorService {
  private readonly logger = new Logger(ResourceMonitorService.name);
  private readonly keepAliveEnabled: boolean;
  private readonly memoryOptimizationEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.keepAliveEnabled = this.configService.get('ENABLE_KEEP_ALIVE') === 'true';
    this.memoryOptimizationEnabled = this.configService.get('OPTIMIZE_MEMORY') === 'true';
    this.logger.log('🔧 Resource Monitor initialized');
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async monitorResources() {
    const resources = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      timestamp: new Date()
    };

    const memoryUsageMB = Math.round(resources.memory.heapUsed / 1024 / 1024);
    const memoryPercentage = (resources.memory.heapUsed / (512 * 1024 * 1024)) * 100; // 512MB free tier limit

    // Free tier memory warning at 80% of 512MB (410MB)
    if (memoryUsageMB > 410) {
      this.logger.warn(`🚨 Memory usage high: ${memoryUsageMB}MB (${memoryPercentage.toFixed(1)}%) - approaching free tier limit`);
      
      if (this.memoryOptimizationEnabled) {
        await this.optimizeMemory();
      }
    }

    // Log resource usage every 15 minutes for monitoring
    if (Math.floor(resources.uptime / 300) % 3 === 0) { // Every 15 minutes
      this.logger.log(`📊 Resources: Memory ${memoryUsageMB}MB (${memoryPercentage.toFixed(1)}%), Uptime ${Math.round(resources.uptime / 60)}min`);
    }

    return {
      memoryUsageMB,
      memoryPercentage: memoryPercentage.toFixed(1),
      uptimeMinutes: Math.round(resources.uptime / 60),
      status: memoryUsageMB > 410 ? 'WARNING' : 'HEALTHY'
    };
  }

  @Cron('*/25 * * * *') // Every 25 minutes (before 30-min sleep on free tier)
  async preventSleep() {
    if (!this.keepAliveEnabled) {
      return;
    }

    // Don't keep alive during low-usage hours (2 AM - 6 AM UTC) to save quota
    const hour = new Date().getUTCHours();
    if (hour >= 2 && hour <= 6) {
      this.logger.log('😴 Allowing sleep during low-usage period (2-6 AM UTC)');
      return;
    }

    try {
      const baseUrl = this.configService.get('BASE_URL') || 'https://lif3-backend-clean.onrender.com';
      const response = await fetch(`${baseUrl}/health`);
      
      if (response.ok) {
        this.logger.log('💚 Keep-alive ping successful - preventing sleep');
      } else {
        this.logger.warn(`⚠️ Keep-alive ping returned ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`❌ Keep-alive ping failed: ${error.message}`);
    }
  }

  @Cron('0 */6 * * *') // Every 6 hours
  async reportResourceUsage() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const memoryUsageMB = Math.round(memory.heapUsed / 1024 / 1024);
    
    // Calculate approximate monthly usage (Render free tier: 750 hours/month)
    const hoursUsed = uptime / 3600;
    const projectedMonthlyHours = (hoursUsed / (new Date().getDate())) * 30;
    
    this.logger.log(`📈 Resource Report: ${memoryUsageMB}MB memory, ${hoursUsed.toFixed(1)}h uptime, ~${projectedMonthlyHours.toFixed(0)}h/month projected`);
    
    if (projectedMonthlyHours > 700) {
      this.logger.warn('🚨 Projected monthly usage approaching free tier limit (750h)');
    }

    return {
      memoryUsageMB,
      uptimeHours: hoursUsed.toFixed(1),
      projectedMonthlyHours: projectedMonthlyHours.toFixed(0),
      freeHoursRemaining: Math.max(0, 750 - projectedMonthlyHours).toFixed(0)
    };
  }

  private async optimizeMemory() {
    try {
      // Force garbage collection if available
      if (global.gc) {
        const beforeMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        global.gc();
        const afterMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        this.logger.log(`🧹 Garbage collection: ${beforeMemory}MB → ${afterMemory}MB (saved ${beforeMemory - afterMemory}MB)`);
      } else {
        this.logger.warn('🚫 Garbage collection not available (start with --expose-gc for manual GC)');
      }

      // Clear any internal caches (implement based on your app's caching)
      await this.clearCaches();
      
    } catch (error) {
      this.logger.error(`Failed to optimize memory: ${error.message}`);
    }
  }

  private async clearCaches() {
    // Implement cache clearing logic based on your application
    // For example: clear Redis cache, in-memory caches, etc.
    this.logger.log('🗑️ Clearing application caches');
  }

  async getResourceStatus() {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: ((memory.heapUsed / (512 * 1024 * 1024)) * 100).toFixed(1)
      },
      uptime: {
        seconds: uptime,
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
      },
      freeTier: {
        memoryLimit: '512MB',
        monthlyHours: '750h',
        status: memory.heapUsed > 410 * 1024 * 1024 ? 'WARNING' : 'OK'
      },
      optimizations: {
        keepAlive: this.keepAliveEnabled,
        memoryOptimization: this.memoryOptimizationEnabled
      }
    };
  }
}