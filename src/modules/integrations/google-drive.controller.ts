import { Controller, Get, Post, Body, UseGuards, UseInterceptors, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GoogleDriveService, DailyBriefingData, FileOperationResult } from './google-drive.service';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { AuditLogGuard } from '../../common/guards/audit-log.guard';
import { LogIntegrationEvent } from '../../common/decorators/audit-log.decorator';

@ApiTags('Google Drive Integration')
@Controller('integrations/google-drive')
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Trigger manual financial data sync to Google Drive' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  @ApiResponse({ status: 500, description: 'Sync failed' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Manual Google Drive sync triggered')
  async syncFinancialData(@Body() financialData: any): Promise<FileOperationResult> {
    return await this.googleDriveService.syncFinancialData(financialData);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get Google Drive connection and sync status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getSyncStatus(): Promise<any> {
    return await this.googleDriveService.getSyncStatus();
  }

  @Post('create-briefing')
  @ApiOperation({ summary: 'Create daily briefing document in Google Drive' })
  @ApiResponse({ status: 200, description: 'Daily briefing created successfully' })
  @ApiResponse({ status: 500, description: 'Briefing creation failed' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Manual daily briefing creation')
  async createDailyBriefing(@Body() briefingData: DailyBriefingData): Promise<FileOperationResult> {
    return await this.googleDriveService.createDailyBriefing(briefingData);
  }

  @Get('files')
  @ApiOperation({ summary: 'List all files in the LIF3 Google Drive folder' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async listFiles(): Promise<any[]> {
    return await this.googleDriveService.listFiles();
  }

  @Post('create-folders')
  @ApiOperation({ summary: 'Create LIF3 folder structure in Google Drive' })
  @ApiResponse({ status: 200, description: 'Folder structure created successfully' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('LIF3 folder structure creation')
  async createFolderStructure(): Promise<{ success: boolean }> {
    const success = await this.googleDriveService.createLIF3FreshStartFolderStructure();
    return { success };
  }

  @Post('backup')
  @ApiOperation({ summary: 'Create manual backup of financial data' })
  @ApiResponse({ status: 200, description: 'Backup created successfully' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Manual financial data backup')
  async createBackup(@Body() backupData: any): Promise<FileOperationResult> {
    return await this.googleDriveService.backupFinancialData({
      ...backupData,
      backupType: 'MANUAL',
      timestamp: new Date().toISOString()
    });
  }

  @Post('save-report')
  @ApiOperation({ summary: 'Save financial report to Google Drive' })
  @ApiResponse({ status: 200, description: 'Report saved successfully' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('Financial report saved to Google Drive')
  async saveFinancialReport(
    @Body() reportData: { data: any; type: string }
  ): Promise<FileOperationResult> {
    return await this.googleDriveService.saveFinancialReport(reportData.data, reportData.type);
  }

  @Post('save-43v3r-metrics')
  @ApiOperation({ summary: 'Save 43V3R business metrics to Google Drive' })
  @ApiResponse({ status: 200, description: '43V3R metrics saved successfully' })
  @UseGuards(AuditLogGuard)
  @LogIntegrationEvent('43V3R metrics saved to Google Drive')
  async save43V3RMetrics(@Body() metricsData: any): Promise<FileOperationResult> {
    return await this.googleDriveService.save43V3RMetrics(metricsData);
  }

  @Get('download/:fileId')
  @ApiOperation({ summary: 'Download file from Google Drive by ID' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadFile(@Param('fileId') fileId: string): Promise<any> {
    return await this.googleDriveService.downloadFile(fileId);
  }

  @Post('test-briefing')
  @ApiOperation({ summary: 'Test daily briefing generation with current data' })
  @ApiResponse({ status: 200, description: 'Test briefing created successfully' })
  async testDailyBriefing(): Promise<FileOperationResult> {
    const testData: DailyBriefingData = {
      date: new Date().toISOString().split('T')[0],
      netWorth: 239625,
      dailyRevenue: 0,
      goalProgress: (239625 / 1800000) * 100,
      transactions: [
        { description: 'Salary', amount: 85000, type: 'CREDIT', date: new Date() },
        { description: 'Rent', amount: -18000, type: 'DEBIT', date: new Date() },
        { description: 'Groceries', amount: -3200, type: 'DEBIT', date: new Date() }
      ],
      businessMetrics: {
        dailyRevenue: 0,
        mrr: 0,
        weeklyTarget: 34167,
        monthlyTarget: 147917,
        businessName: '43V3R',
        industry: 'AI_WEB3_CRYPTO',
        location: 'CAPE_TOWN_SA'
      }
    };

    return await this.googleDriveService.createDailyBriefing(testData);
  }
}