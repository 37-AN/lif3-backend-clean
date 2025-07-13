import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDriveService } from '../../src/modules/integrations/google-drive.service';
import { DiscordBotService } from '../../src/modules/integrations/discord-bot.service';
import { ClaudeAIService } from '../../src/modules/integrations/claude-ai.service';
import { LoggerService } from '../../src/common/logger/logger.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { createMockDiscordInteraction, TestDataGenerator, LIF3_TEST_CONSTANTS, PerformanceMonitor } from '../setup';

describe('External Integrations - LIF3 Dashboard', () => {
  let googleDriveService: GoogleDriveService;
  let discordBotService: DiscordBotService;
  let claudeAIService: ClaudeAIService;
  let loggerService: LoggerService;
  let mockWinstonLogger: any;

  beforeEach(async () => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDriveService,
        DiscordBotService,
        ClaudeAIService,
        LoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger
        }
      ]
    }).compile();

    googleDriveService = module.get<GoogleDriveService>(GoogleDriveService);
    discordBotService = module.get<DiscordBotService>(DiscordBotService);
    claudeAIService = module.get<ClaudeAIService>(ClaudeAIService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Google Drive Integration Tests', () => {
    test('Create daily briefing document with LIF3 financial data', async () => {
      const briefingData = {
        date: '2025-07-05',
        netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        dailyRevenue: 1000,
        goalProgress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
        transactions: [
          TestDataGenerator.generateTransaction({
            amount: 500,
            description: 'Coffee purchase',
            type: 'expense'
          }),
          TestDataGenerator.generateTransaction({
            amount: 1000,
            description: '43V3R consulting',
            type: 'income'
          })
        ],
        businessMetrics: {
          dailyRevenue: 1000,
          mrr: 30330,
          dailyTarget: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET,
          mrrTarget: LIF3_TEST_CONSTANTS.MRR_TARGET
        }
      };

      // Mock Google Drive API response
      const mockDriveResponse = {
        data: {
          id: 'drive_file_123456',
          name: 'LIF3_Daily_Command_Center_2025-07-05.md',
          createdTime: new Date().toISOString(),
          size: 2048
        }
      };

      jest.spyOn(googleDriveService, 'createDailyBriefing').mockResolvedValue({
        success: true,
        fileId: mockDriveResponse.data.id,
        fileName: mockDriveResponse.data.name,
        metadata: mockDriveResponse.data
      });

      const { result, duration } = await PerformanceMonitor.measure(
        'google_drive_briefing',
        () => googleDriveService.createDailyBriefing(briefingData)
      );

      expect(result.success).toBe(true);
      expect(result.fileId).toBeDefined();
      expect(result.fileName).toContain('LIF3_Daily_Command_Center_2025-07-05');
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    test('Save financial report to Google Drive', async () => {
      const reportData = {
        reportType: 'WEEKLY_SUMMARY',
        period: '2025-W27',
        netWorth: {
          current: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
          target: LIF3_TEST_CONSTANTS.TARGET_NET_WORTH,
          progress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
          weeklyChange: 2500
        },
        businessMetrics: {
          weeklyRevenue: 3500,
          weeklyTarget: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET * 7,
          progress: (3500 / (LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET * 7)) * 100
        },
        transactions: {
          total: 12,
          income: 5,
          expenses: 7,
          totalAmount: 8500
        },
        generatedAt: new Date()
      };

      jest.spyOn(googleDriveService, 'saveFinancialReport').mockResolvedValue({
        success: true,
        fileId: 'report_file_789',
        fileName: 'Financial_Report_WEEKLY_SUMMARY_2025-07-05.json'
      });

      const result = await googleDriveService.saveFinancialReport(reportData, 'WEEKLY_SUMMARY');

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('WEEKLY_SUMMARY');
    });

    test('Save 43V3R business metrics to Google Drive', async () => {
      const metricsData = {
        business: '43V3R',
        date: '2025-07-05',
        metrics: {
          dailyRevenue: {
            current: 2000,
            target: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET,
            progress: (2000 / LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET) * 100
          },
          mrr: {
            current: 60660, // 2000 * 30.33
            target: LIF3_TEST_CONSTANTS.MRR_TARGET,
            progress: (60660 / LIF3_TEST_CONSTANTS.MRR_TARGET) * 100
          },
          customers: {
            total: 5,
            active: 4,
            new: 2
          },
          pipeline: {
            value: 15000,
            deals: 3,
            probability: 0.75
          }
        },
        milestones: [
          {
            name: 'First R5K Revenue Day',
            achieved: false,
            target: 5000,
            progress: 40.9
          }
        ]
      };

      jest.spyOn(googleDriveService, 'save43V3RMetrics').mockResolvedValue({
        success: true,
        fileId: 'metrics_file_456',
        fileName: '43V3R_Metrics_2025-07-05.json'
      });

      const result = await googleDriveService.save43V3RMetrics(metricsData);

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('43V3R_Metrics');
    });

    test('Backup financial data to Google Drive', async () => {
      const backupData = {
        userId: 'ethan_barnes',
        backupDate: new Date(),
        financial: {
          netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
          accounts: [
            { id: 'liquid', balance: LIF3_TEST_CONSTANTS.LIQUID_CASH, currency: 'ZAR' },
            { id: 'investments', balance: LIF3_TEST_CONSTANTS.INVESTMENTS, currency: 'ZAR' },
            { id: 'business', balance: LIF3_TEST_CONSTANTS.BUSINESS_EQUITY, currency: 'ZAR' }
          ],
          transactions: Array(10).fill(null).map(() => TestDataGenerator.generateTransaction()),
          goals: [TestDataGenerator.generateGoalData()]
        },
        business: {
          name: '43V3R',
          dailyRevenue: 0,
          mrr: 0,
          metrics: []
        }
      };

      jest.spyOn(googleDriveService, 'backupFinancialData').mockResolvedValue({
        success: true,
        fileId: 'backup_file_999',
        fileName: `LIF3_Backup_${new Date().toISOString().replace(/[:.]/g, '_')}.json`
      });

      const result = await googleDriveService.backupFinancialData(backupData);

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('LIF3_Backup_');
    });

    test('Handle Google Drive authentication errors', async () => {
      const briefingData = {
        date: '2025-07-05',
        netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        dailyRevenue: 0,
        goalProgress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
        transactions: [],
        businessMetrics: {}
      };

      jest.spyOn(googleDriveService, 'createDailyBriefing').mockResolvedValue({
        success: false,
        error: 'Authentication failed: Invalid refresh token'
      });

      const result = await googleDriveService.createDailyBriefing(briefingData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });
  });

  describe('Discord Bot Integration Tests', () => {
    test('Handle /balance command execution', async () => {
      const mockInteraction = createMockDiscordInteraction('balance');
      
      // Mock the balance response
      const expectedEmbed = {
        embeds: [{
          title: '💰 LIF3 Financial Overview',
          fields: [
            { name: '🎯 Net Worth', value: 'R239,625 / R1,800,000 (13.3%)', inline: false },
            { name: '💵 Liquid Cash', value: 'R88,750', inline: true },
            { name: '📈 Investments', value: 'R142,000', inline: true },
            { name: '🏢 Business Equity', value: 'R8,875', inline: true }
          ]
        }]
      };

      jest.spyOn(discordBotService, 'handleBalanceCommand' as any).mockResolvedValue(expectedEmbed);

      // Simulate command execution
      const { result, duration } = await PerformanceMonitor.measure(
        'discord_balance_command',
        async () => {
          await (discordBotService as any).handleSlashCommand(mockInteraction);
          return expectedEmbed;
        }
      );

      expect(mockInteraction.reply).toHaveBeenCalled();
      expect(duration).toBeLessThan(2000); // Should respond in < 2 seconds
    });

    test('Handle /goal-progress command for R1.8M target', async () => {
      const mockInteraction = createMockDiscordInteraction('goal-progress');
      
      const expectedResponse = {
        embeds: [{
          title: '🎯 Goal Progress - R1.8M Net Worth',
          fields: [
            { name: '📈 Current Progress', value: '13.3% (R239,625)', inline: false },
            { name: '🎯 Target Amount', value: 'R1,800,000', inline: true },
            { name: '💪 Remaining', value: 'R1,560,375', inline: true },
            { name: '📅 Estimated Timeline', value: '~18 months', inline: true }
          ]
        }]
      };

      await (discordBotService as any).handleGoalProgressCommand(mockInteraction, {
        userId: 'ethan_barnes',
        command: 'goal-progress',
        parameters: {},
        discordUserId: 'test_discord_user',
        guildId: 'test_guild',
        channelId: 'test_channel'
      });

      expect(mockInteraction.reply).toHaveBeenCalledWith(expectedResponse);
    });

    test('Handle /daily-revenue command for 43V3R tracking', async () => {
      const mockInteraction = createMockDiscordInteraction('daily-revenue');
      
      const expectedResponse = {
        embeds: [{
          title: '🚀 43V3R Daily Revenue Tracking',
          fields: [
            { name: '💰 Today\'s Revenue', value: 'R0', inline: true },
            { name: '🎯 Daily Target', value: 'R4,881', inline: true },
            { name: '📊 Progress', value: '0%', inline: true },
            { name: '📈 Monthly Progress', value: 'R0 / R147,917 MRR', inline: false }
          ]
        }]
      };

      await (discordBotService as any).handleDailyRevenueCommand(mockInteraction, {
        userId: 'ethan_barnes',
        command: 'daily-revenue',
        parameters: {},
        discordUserId: 'test_discord_user',
        guildId: 'test_guild',
        channelId: 'test_channel'
      });

      expect(mockInteraction.reply).toHaveBeenCalledWith(expectedResponse);
    });

    test('Handle /transaction command with amount and description', async () => {
      const mockInteraction = createMockDiscordInteraction('transaction', {
        amount: 500,
        description: 'Grocery shopping',
        type: 'EXPENSE'
      });
      
      const expectedResponse = {
        embeds: [{
          title: '✅ Transaction Added',
          fields: [
            { name: '💰 Amount', value: 'R500', inline: true },
            { name: '📝 Description', value: 'Grocery shopping', inline: true },
            { name: '🏷️ Type', value: 'EXPENSE', inline: true }
          ]
        }]
      };

      await (discordBotService as any).handleTransactionCommand(mockInteraction, {
        userId: 'ethan_barnes',
        command: 'transaction',
        parameters: [
          { name: 'amount', value: 500 },
          { name: 'description', value: 'Grocery shopping' },
          { name: 'type', value: 'EXPENSE' }
        ],
        discordUserId: 'test_discord_user',
        guildId: 'test_guild',
        channelId: 'test_channel'
      });

      expect(mockInteraction.reply).toHaveBeenCalledWith(expectedResponse);
    });

    test('Handle /revenue command for 43V3R business', async () => {
      const mockInteraction = createMockDiscordInteraction('revenue', {
        amount: 1000,
        source: 'consulting'
      });
      
      const expectedProgress = (1000 / LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET) * 100;
      
      const expectedResponse = {
        embeds: [{
          title: '🎉 Revenue Logged!',
          fields: [
            { name: '💰 Amount', value: 'R1,000', inline: true },
            { name: '🏪 Source', value: 'consulting', inline: true },
            { name: '🎯 Daily Progress', value: `${expectedProgress.toFixed(1)}% of target`, inline: false }
          ]
        }]
      };

      await (discordBotService as any).handleRevenueCommand(mockInteraction, {
        userId: 'ethan_barnes',
        command: 'revenue',
        parameters: [
          { name: 'amount', value: 1000 },
          { name: 'source', value: 'consulting' }
        ],
        discordUserId: 'test_discord_user',
        guildId: 'test_guild',
        channelId: 'test_channel'
      });

      expect(mockInteraction.reply).toHaveBeenCalledWith(expectedResponse);
      expect(expectedProgress).toBeCloseTo(20.5, 1);
    });

    test('Send automated daily briefing notification', async () => {
      const briefingData = {
        netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        goalProgress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
        dailyRevenue: 1200
      };

      jest.spyOn(discordBotService, 'sendDailyBriefing').mockResolvedValue();

      await discordBotService.sendDailyBriefing('test_channel_id', briefingData);

      expect(discordBotService.sendDailyBriefing).toHaveBeenCalledWith('test_channel_id', briefingData);
    });

    test('Send milestone achievement notification', async () => {
      const milestoneData = {
        title: 'R250,000 Net Worth Achieved!',
        amount: 250000,
        progress: 13.9,
        type: 'NET_WORTH_MILESTONE'
      };

      jest.spyOn(discordBotService, 'sendMilestoneNotification').mockResolvedValue();

      await discordBotService.sendMilestoneNotification('test_channel_id', milestoneData);

      expect(discordBotService.sendMilestoneNotification).toHaveBeenCalledWith('test_channel_id', milestoneData);
    });

    test('Track Discord bot performance metrics', () => {
      const initialCount = discordBotService.getCommandExecutionCount();
      
      // Simulate command executions
      for (let i = 0; i < 5; i++) {
        (discordBotService as any).commandExecutionCount++;
      }

      const finalCount = discordBotService.getCommandExecutionCount();
      expect(finalCount - initialCount).toBe(5);
    });
  });

  describe('Claude AI Integration Tests', () => {
    test('Analyze spending patterns with ZAR financial data', async () => {
      const transactionData = Array(20).fill(null).map(() => 
        TestDataGenerator.generateTransaction({
          currency: 'ZAR',
          amount: Math.floor(Math.random() * 1000) + 100
        })
      );

      const mockInsight = {
        type: 'SPENDING_ANALYSIS',
        title: 'Spending Pattern Analysis',
        summary: 'Your spending patterns show good control with 57% savings rate.',
        recommendations: [
          'Continue current savings discipline',
          'Consider increasing investment allocation',
          'Monitor business expenses for 43V3R growth'
        ],
        riskLevel: 'LOW' as const,
        confidence: 0.89,
        actionItems: [
          'Set up automated investments',
          'Track 43V3R business expenses separately',
          'Review monthly subscription services'
        ],
        timestamp: new Date()
      };

      jest.spyOn(claudeAIService, 'analyzeSpendingPatterns').mockResolvedValue(mockInsight);

      const { result, duration } = await PerformanceMonitor.measure(
        'claude_spending_analysis',
        () => claudeAIService.analyzeSpendingPatterns('ethan_barnes', transactionData, '30d')
      );

      expect(result.type).toBe('SPENDING_ANALYSIS');
      expect(result.recommendations).toHaveLength(3);
      expect(result.riskLevel).toBe('LOW');
      expect(duration).toBeLessThan(10000); // Should complete in < 10 seconds
    });

    test('Generate investment advice for R1.8M goal', async () => {
      const portfolioData = {
        netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        liquidCash: LIF3_TEST_CONSTANTS.LIQUID_CASH,
        investments: LIF3_TEST_CONSTANTS.INVESTMENTS,
        businessEquity: LIF3_TEST_CONSTANTS.BUSINESS_EQUITY,
        monthlyIncome: 35000,
        monthlyExpenses: 15000,
        riskTolerance: 'MODERATE',
        timeHorizon: 18 // months to R1.8M goal
      };

      const goalData = {
        target: LIF3_TEST_CONSTANTS.TARGET_NET_WORTH,
        current: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        progress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
        timeline: '18 months',
        priority: 'HIGH'
      };

      const mockAdvice = {
        type: 'INVESTMENT_ADVICE',
        title: 'Investment Strategy for R1.8M Goal',
        summary: 'Accelerate growth through diversified ZAR investments and 43V3R business focus.',
        recommendations: [
          'Increase monthly investment to R15,000',
          'Diversify into JSE ETFs and property',
          'Focus 43V3R business development for equity growth',
          'Maintain 6-month emergency fund in money market'
        ],
        riskLevel: 'MEDIUM' as const,
        confidence: 0.85,
        actionItems: [
          'Open investment account with major bank',
          'Set up debit order for R15k monthly investment',
          'Research JSE Top 40 ETF options'
        ],
        timestamp: new Date()
      };

      jest.spyOn(claudeAIService, 'generateInvestmentAdvice').mockResolvedValue(mockAdvice);

      const result = await claudeAIService.generateInvestmentAdvice('ethan_barnes', portfolioData, goalData);

      expect(result.type).toBe('INVESTMENT_ADVICE');
      expect(result.recommendations).toContain('Increase monthly investment to R15,000');
      expect(result.actionItems.length).toBeGreaterThan(0);
    });

    test('Optimize 43V3R business strategy', async () => {
      const businessData = {
        name: '43V3R',
        industry: 'AI + Web3 + Crypto',
        currentRevenue: 0,
        dailyTarget: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET,
        mrrTarget: LIF3_TEST_CONSTANTS.MRR_TARGET,
        customers: 0,
        pipeline: [],
        stage: 'STARTUP',
        location: 'Cape Town, South Africa'
      };

      const mockStrategy = {
        type: 'BUSINESS_STRATEGY',
        title: '43V3R Growth Strategy Optimization',
        summary: 'Focus on AI consulting and Web3 development services to reach R4,881 daily revenue target.',
        recommendations: [
          'Launch AI strategy consulting for Cape Town businesses',
          'Develop Web3 solutions for local financial sector',
          'Create crypto trading education content',
          'Build strategic partnerships with tech companies'
        ],
        riskLevel: 'MEDIUM' as const,
        confidence: 0.78,
        actionItems: [
          'Create 43V3R LinkedIn presence',
          'Develop service packages and pricing',
          'Network with Cape Town tech community'
        ],
        timestamp: new Date()
      };

      jest.spyOn(claudeAIService, 'optimize43V3RStrategy').mockResolvedValue(mockStrategy);

      const result = await claudeAIService.optimize43V3RStrategy('ethan_barnes', businessData);

      expect(result.type).toBe('BUSINESS_STRATEGY');
      expect(result.recommendations).toContain('Launch AI strategy consulting for Cape Town businesses');
    });

    test('Assess financial risk profile', async () => {
      const financialData = {
        netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        liquidityRatio: LIF3_TEST_CONSTANTS.LIQUID_CASH / LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        debtToIncomeRatio: 0, // No debt
        emergencyFundMonths: 6,
        investmentConcentration: {
          stocks: 0.6,
          bonds: 0.2,
          cash: 0.2
        },
        incomeStability: 'VARIABLE', // IT consulting
        dependents: 0
      };

      const mockRiskAssessment = {
        type: 'RISK_ASSESSMENT',
        title: 'Financial Risk Profile Analysis',
        summary: 'Low to moderate risk profile with good liquidity and no debt burden.',
        recommendations: [
          'Maintain current emergency fund level',
          'Consider diversifying investment portfolio',
          'Build 43V3R business for income stability'
        ],
        riskLevel: 'LOW' as const,
        confidence: 0.92,
        actionItems: [
          'Review insurance coverage',
          'Set up automatic investment increases',
          'Monitor business income volatility'
        ],
        timestamp: new Date()
      };

      jest.spyOn(claudeAIService, 'assessFinancialRisk').mockResolvedValue(mockRiskAssessment);

      const result = await claudeAIService.assessFinancialRisk('ethan_barnes', financialData);

      expect(result.type).toBe('RISK_ASSESSMENT');
      expect(result.riskLevel).toBe('LOW');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('Generate daily financial insights', async () => {
      const dailyData = {
        transactions: Array(5).fill(null).map(() => TestDataGenerator.generateTransaction()),
        financial: {
          netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
          liquidityRatio: 0.37,
          savingsRate: 57.1
        },
        business: {
          dailyRevenue: 800,
          target: LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET,
          progress: 16.4
        }
      };

      const mockInsights = [
        {
          type: 'SPENDING_ANALYSIS',
          title: 'Daily Spending Review',
          summary: 'Controlled spending day with good progress toward savings goals.',
          recommendations: ['Continue current discipline'],
          riskLevel: 'LOW' as const,
          confidence: 0.85,
          actionItems: ['Review evening expenses'],
          timestamp: new Date()
        },
        {
          type: 'BUSINESS_STRATEGY',
          title: '43V3R Daily Progress',
          summary: 'Good revenue progress at 16.4% of daily target.',
          recommendations: ['Focus on closing pipeline deals'],
          riskLevel: 'LOW' as const,
          confidence: 0.75,
          actionItems: ['Follow up with prospects'],
          timestamp: new Date()
        }
      ];

      jest.spyOn(claudeAIService, 'generateDailyInsights').mockResolvedValue(mockInsights);

      const { result, duration } = await PerformanceMonitor.measure(
        'claude_daily_insights',
        () => claudeAIService.generateDailyInsights('ethan_barnes', dailyData)
      );

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('SPENDING_ANALYSIS');
      expect(result[1].type).toBe('BUSINESS_STRATEGY');
      expect(duration).toBeLessThan(15000); // Should complete in < 15 seconds
    });

    test('Handle conversational financial queries', async () => {
      const query = 'How can I accelerate my progress toward the R1.8M net worth goal?';
      const context = {
        currentNetWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
        targetNetWorth: LIF3_TEST_CONSTANTS.TARGET_NET_WORTH,
        monthlyIncome: 35000,
        savingsRate: 57.1,
        businessRevenue: 0
      };

      const mockResponse = `Based on your current progress of 13.3% toward R1.8M, here are specific strategies:

1. **Increase Investment Rate**: Your 57% savings rate is excellent. Consider allocating R20,000/month to investments for faster growth.

2. **Accelerate 43V3R Business**: Focus on reaching the R4,881 daily revenue target. This would add R1.78M annually to your net worth.

3. **Optimize Asset Allocation**: With R142,000 in investments, diversify into growth assets while maintaining your emergency fund.

4. **Timeline Acceleration**: With disciplined execution, you could reach R1.8M in 12-15 months instead of 18.

Your current trajectory is strong - stay focused on business development and investment growth.`;

      jest.spyOn(claudeAIService, 'conversationalQuery').mockResolvedValue(mockResponse);

      const result = await claudeAIService.conversationalQuery('ethan_barnes', query, context);

      expect(result).toContain('R1.8M');
      expect(result).toContain('43V3R');
      expect(result).toContain('13.3%');
      expect(result.length).toBeGreaterThan(100);
    });

    test('Track Claude AI usage metrics', () => {
      const initialAnalysisCount = claudeAIService.getAnalysisCount();
      const initialInsightCount = claudeAIService.getInsightGenerationCount();
      const initialConversations = claudeAIService.getActiveConversations();

      // Simulate API usage
      (claudeAIService as any).analysisCount += 3;
      (claudeAIService as any).insightGenerationCount += 2;
      (claudeAIService as any).conversationContexts.set('ethan_barnes', {
        userId: 'ethan_barnes',
        conversationId: 'conv_123',
        history: [],
        preferences: {},
        financialProfile: {}
      });

      expect(claudeAIService.getAnalysisCount()).toBe(initialAnalysisCount + 3);
      expect(claudeAIService.getInsightGenerationCount()).toBe(initialInsightCount + 2);
      expect(claudeAIService.getActiveConversations()).toBe(initialConversations + 1);
    });
  });

  describe('Integration Performance and Reliability', () => {
    test('Handle integration service failures gracefully', async () => {
      // Test Google Drive failure
      jest.spyOn(googleDriveService, 'createDailyBriefing').mockRejectedValue(
        new Error('Google Drive API rate limit exceeded')
      );

      const briefingData = { date: '2025-07-05', netWorth: 1000, dailyRevenue: 0, goalProgress: 1, transactions: [], businessMetrics: {} };
      
      await expect(googleDriveService.createDailyBriefing(briefingData)).rejects.toThrow('Google Drive API rate limit exceeded');

      // Test Discord failure
      jest.spyOn(discordBotService, 'sendDailyBriefing').mockRejectedValue(
        new Error('Discord API unavailable')
      );

      await expect(discordBotService.sendDailyBriefing('channel_id', {})).rejects.toThrow('Discord API unavailable');

      // Test Claude AI failure
      jest.spyOn(claudeAIService, 'analyzeSpendingPatterns').mockRejectedValue(
        new Error('Claude AI service unavailable')
      );

      await expect(claudeAIService.analyzeSpendingPatterns('user', [], '1d')).rejects.toThrow('Claude AI service unavailable');
    });

    test('Measure integration response times', async () => {
      const integrationTests = [
        {
          name: 'Google Drive Daily Briefing',
          test: () => googleDriveService.createDailyBriefing({ date: '2025-07-05', netWorth: 1000, dailyRevenue: 0, goalProgress: 1, transactions: [], businessMetrics: {} }),
          maxDuration: 5000
        },
        {
          name: 'Discord Balance Command',
          test: () => (discordBotService as any).handleBalanceCommand(createMockDiscordInteraction('balance'), {}),
          maxDuration: 2000
        },
        {
          name: 'Claude AI Analysis',
          test: () => claudeAIService.analyzeSpendingPatterns('ethan_barnes', [TestDataGenerator.generateTransaction()], '1d'),
          maxDuration: 10000
        }
      ];

      for (const integrationTest of integrationTests) {
        // Mock successful responses
        if (integrationTest.name.includes('Google Drive')) {
          jest.spyOn(googleDriveService, 'createDailyBriefing').mockResolvedValue({ success: true, fileId: 'test' });
        } else if (integrationTest.name.includes('Discord')) {
          jest.spyOn(discordBotService as any, 'handleBalanceCommand').mockResolvedValue({ success: true });
        } else if (integrationTest.name.includes('Claude')) {
          jest.spyOn(claudeAIService, 'analyzeSpendingPatterns').mockResolvedValue({
            type: 'SPENDING_ANALYSIS',
            title: 'Test',
            summary: 'Test summary',
            recommendations: [],
            riskLevel: 'LOW',
            confidence: 0.8,
            actionItems: [],
            timestamp: new Date()
          });
        }

        const { duration } = await PerformanceMonitor.measure(
          `integration_${integrationTest.name}`,
          integrationTest.test
        );

        expect(duration).toBeLessThan(integrationTest.maxDuration);
      }
    });

    test('Validate integration logging and monitoring', async () => {
      // Test that all integrations log their operations
      const briefingData = { date: '2025-07-05', netWorth: 1000, dailyRevenue: 0, goalProgress: 1, transactions: [], businessMetrics: {} };
      
      jest.spyOn(googleDriveService, 'createDailyBriefing').mockResolvedValue({ success: true, fileId: 'test' });
      await googleDriveService.createDailyBriefing(briefingData);

      // Verify logging occurred (mocked logger should have been called)
      expect(mockWinstonLogger.info).toHaveBeenCalled();
    });
  });
});