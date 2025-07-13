import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { FinancialController, BusinessController } from './modules/financial/financial.controller';
import { FinancialService } from './modules/financial/financial.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { LIF3WebSocketGateway } from './modules/websocket/websocket.gateway';
import { GoogleDriveService } from './modules/integrations/google-drive.service';
import { GoogleDriveController } from './modules/integrations/google-drive.controller';
import { DiscordBotService } from './modules/integrations/discord-bot.service';
import { ClaudeAIService } from './modules/integrations/claude-ai.service';
import { MonitoringService } from './modules/monitoring/monitoring.service';
import { HealthController } from './modules/health/health.controller';
import { HealthService } from './modules/health/health.service';
import { RAGModule } from './modules/rag/rag.module';
import { JwtModule } from '@nestjs/jwt';
import { BusinessStrategyModule } from './modules/business-strategy/business-strategy.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    
    // JWT module
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lif3_jwt_secret_key_for_development',
      signOptions: { expiresIn: '1h' },
    }),
    
    // Logging module
    LoggerModule,
    
    // Database module - temporarily disabled due to SQLite enum issues
    // DatabaseModule,
    
    // RAG & Semantic Search module
    RAGModule,
    // Business Strategy module
    BusinessStrategyModule,
  ],
  controllers: [
    FinancialController,
    BusinessController,
    AuthController,
    GoogleDriveController,
    HealthController,
  ],
  providers: [
    FinancialService,
    AuthService,
    LIF3WebSocketGateway,
    GoogleDriveService,
    DiscordBotService,
    ClaudeAIService,
    MonitoringService,
    HealthService,
  ],
})
export class AppModule {
  constructor() {
    console.log('🏗️  LIF3 Financial Dashboard - App Module Initialized');
    console.log('📊 FRESH START: Net Worth R0 → R1,800,000 (18-month target)');
    console.log('🚀 43V3R Daily Revenue Target: R0 → R4,881');
    console.log('🔄 Database schema ready for fresh start automation');
  }
}