import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialService, CreateTransactionDto, UpdateBalanceDto } from './financial.service';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
import { AuditLogGuard } from '../../common/guards/audit-log.guard';
import { 
  LogFinancialTransaction, 
  LogAccountUpdate, 
  LogGoalProgress, 
  LogBusinessMetric 
} from '../../common/decorators/audit-log.decorator';

@ApiTags('Financial')
@Controller('financial')
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get complete financial overview in ZAR' })
  @ApiResponse({ status: 200, description: 'Financial dashboard data' })
  @UseGuards(AuditLogGuard)
  async getDashboard(@Request() req) {
    const userId = req.user?.id || 'ethan_barnes';
    const netWorth = await this.financialService.calculateNetWorth(userId);
    
    return {
      user: {
        id: userId,
        name: 'Ethan Barnes',
        email: 'ethan@43v3r.ai'
      },
      netWorth,
      summary: {
        totalNetWorth: netWorth.current,
        targetNetWorth: netWorth.target,
        progressPercent: netWorth.progress,
        remainingToTarget: netWorth.target - netWorth.current,
        monthsToTarget: Math.ceil((netWorth.target - netWorth.current) / 15000) // Assuming R15k/month growth
      },
      accounts: [
        { id: 'liquid', name: 'Liquid Cash', balance: netWorth.liquidCash, currency: 'ZAR' },
        { id: 'investments', name: 'Investments', balance: netWorth.investments, currency: 'ZAR' },
        { id: 'business', name: '43V3R Business Equity', balance: netWorth.businessEquity, currency: 'ZAR' }
      ],
      businessMetrics: {
        dailyRevenueTarget: 4881,
        currentDailyRevenue: 0,
        mrrTarget: 147917,
        currentMRR: 0,
        revenueProgress: 0
      },
      goals: [
        {
          id: 'net_worth_goal',
          name: 'Net Worth Target',
          target: netWorth.target,
          current: netWorth.current,
          progress: netWorth.progress,
          deadline: '2025-12-31'
        }
      ]
    };
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @UseGuards(AuditLogGuard)
  @LogFinancialTransaction('New financial transaction created')
  async createTransaction(@Body() dto: CreateTransactionDto, @Request() req) {
    const userId = req.user?.id || 'ethan_barnes';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    return await this.financialService.createTransaction(userId, dto, ipAddress, userAgent);
  }

  @Put('accounts/:id/balance')
  @ApiOperation({ summary: 'Update account balance' })
  @ApiResponse({ status: 200, description: 'Account balance updated successfully' })
  @UseGuards(AuditLogGuard)
  @LogAccountUpdate('Account balance updated')
  async updateAccountBalance(@Param('id') accountId: string, @Body() dto: UpdateBalanceDto, @Request() req) {
    const userId = req.user?.id || 'ethan_barnes';
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    return await this.financialService.updateAccountBalance(userId, { ...dto, accountId }, ipAddress, userAgent);
  }

  @Get('net-worth')
  @ApiOperation({ summary: 'Calculate current net worth' })
  @ApiResponse({ status: 200, description: 'Net worth calculation' })
  @UseGuards(AuditLogGuard)
  @LogGoalProgress('Net worth calculation requested')
  async getNetWorth(@Request() req) {
    const userId = req.user?.id || 'ethan_barnes';
    return await this.financialService.calculateNetWorth(userId);
  }

  @Get('goals')
  @ApiOperation({ summary: 'List personal and business goals' })
  @ApiResponse({ status: 200, description: 'Goals list' })
  async getGoals(@Request() req) {
    const userId = req.user?.id || 'ethan_barnes';
    const netWorth = await this.financialService.calculateNetWorth(userId);
    
    return [
      {
        id: 'net_worth_goal',
        name: 'Net Worth Target - R1.8M',
        type: 'NET_WORTH',
        target: netWorth.target,
        current: netWorth.current,
        progress: netWorth.progress,
        deadline: '2025-12-31',
        priority: 'HIGH'
      },
      {
        id: 'daily_revenue_goal',
        name: '43V3R Daily Revenue - R4,881',
        type: 'BUSINESS_REVENUE',
        target: 4881,
        current: 0,
        progress: 0,
        deadline: '2025-01-31',
        priority: 'HIGH'
      },
      {
        id: 'mrr_goal',
        name: '43V3R Monthly Recurring Revenue - R147,917',
        type: 'BUSINESS_MRR',
        target: 147917,
        current: 0,
        progress: 0,
        deadline: '2025-06-30',
        priority: 'HIGH'
      }
    ];
  }

  @Get('analytics/net-worth-trend')
  @ApiOperation({ summary: 'Net worth progression analysis' })
  @ApiResponse({ status: 200, description: 'Net worth trend data' })
  async getNetWorthTrend(@Request() req) {
    const userId = req.user?.id || 'ethan_barnes';
    
    return {
      trend: 'POSITIVE',
      averageMonthlyGrowth: 15000,
      projectedTargetDate: '2025-12-31',
      milestones: [
        { amount: 500000, date: '2025-03-31', achieved: false },
        { amount: 1000000, date: '2025-08-31', achieved: false },
        { amount: 1500000, date: '2025-11-30', achieved: false },
        { amount: 1800000, date: '2025-12-31', achieved: false }
      ]
    };
  }

  @Get('analytics/43v3r-metrics')
  @ApiOperation({ summary: '43V3R business performance metrics' })
  @ApiResponse({ status: 200, description: 'Business metrics data' })
  async get43V3RMetrics(@Request() req) {
    return {
      revenue: {
        daily: { current: 0, target: 4881, progress: 0 },
        monthly: { current: 0, target: 147917, progress: 0 },
        quarterly: { current: 0, target: 443751, progress: 0 }
      },
      customers: {
        total: 0,
        active: 0,
        churn: 0,
        acquisition: 0
      },
      pipeline: {
        value: 0,
        deals: 0,
        conversion: 0
      },
      growth: {
        rate: 0,
        projection: 'AGGRESSIVE',
        targetAchievement: 0
      }
    };
  }
}

@Controller('business')
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly financialService: FinancialService) {}

  @Post('revenue')
  @ApiOperation({ summary: 'Log 43V3R business revenue' })
  @ApiResponse({ status: 201, description: 'Revenue logged successfully' })
  @UseGuards(AuditLogGuard)
  @LogBusinessMetric('43V3R revenue logged')
  async logRevenue(@Body() dto: { amount: number; source: string; description?: string }) {
    return await this.financialService.log43V3RRevenue(dto.amount, dto.source, dto.description);
  }

  @Put('mrr')
  @ApiOperation({ summary: 'Update Monthly Recurring Revenue' })
  @ApiResponse({ status: 200, description: 'MRR updated successfully' })
  @UseGuards(AuditLogGuard)
  @LogBusinessMetric('43V3R MRR updated')
  async updateMRR(@Body() dto: { currentMRR: number }) {
    return await this.financialService.updateMRRProgress(dto.currentMRR);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get 43V3R business KPIs' })
  @ApiResponse({ status: 200, description: 'Business metrics' })
  async getMetrics() {
    return {
      company: '43V3R',
      metrics: {
        dailyRevenue: { current: 0, target: 4881, progress: 0 },
        mrr: { current: 0, target: 147917, progress: 0 },
        customers: { total: 0, active: 0, churn: 0 },
        pipeline: { value: 0, deals: 0, conversion: 0 }
      },
      goals: [
        { metric: 'Daily Revenue', target: 4881, current: 0, priority: 'HIGH' },
        { metric: 'MRR', target: 147917, current: 0, priority: 'HIGH' },
        { metric: 'Customer Acquisition', target: 100, current: 0, priority: 'MEDIUM' }
      ]
    };
  }
}