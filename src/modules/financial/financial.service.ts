import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';

export interface CreateTransactionDto {
  accountId: string;
  amount: number;
  currency: 'ZAR' | 'USD';
  description: string;
  category: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  date: Date;
}

export interface UpdateBalanceDto {
  accountId: string;
  newBalance: number;
  currency: 'ZAR' | 'USD';
  source: 'MANUAL' | 'BANK_SYNC' | 'INTEGRATION';
}

export interface NetWorthMetrics {
  current: number;
  target: number;
  progress: number;
  liquidCash: number;
  investments: number;
  businessEquity: number;
  totalAssets: number;
  totalLiabilities: number;
}

@Injectable()
export class FinancialService {
  constructor(private readonly logger: LoggerService) {}

  async createTransaction(userId: string, dto: CreateTransactionDto, ipAddress?: string, userAgent?: string) {
    const startTime = Date.now();
    
    try {
      this.logger.logFinancialAudit({
        userId,
        action: 'CREATE',
        entity: 'TRANSACTION',
        entityId: dto.accountId,
        amount: dto.amount,
        currency: dto.currency,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        metadata: {
          category: dto.category,
          type: dto.type,
          description: dto.description,
          date: dto.date
        }
      });

      if (dto.currency !== 'ZAR') {
        this.logger.logZARCurrencyOperation(
          'FOREIGN_CURRENCY_TRANSACTION',
          dto.amount,
          dto.currency,
          undefined,
          userId
        );
      }

      const transaction = {
        id: 'tx_' + Date.now(),
        ...dto,
        userId,
        createdAt: new Date(),
      };

      const duration = Date.now() - startTime;
      this.logger.logPerformanceMetric('TRANSACTION_CREATION', duration, 'ms', 'FinancialService');

      this.logger.log(`Transaction created successfully: ${transaction.id}`, 'FinancialService');
      
      return transaction;
    } catch (error) {
      this.logger.error(`Failed to create transaction: ${error.message}`, error.stack, 'FinancialService');
      throw error;
    }
  }

  async updateAccountBalance(userId: string, dto: UpdateBalanceDto, ipAddress?: string, userAgent?: string) {
    const startTime = Date.now();
    
    try {
      const previousBalance = await this.getAccountBalance(dto.accountId);
      
      this.logger.logFinancialAudit({
        userId,
        action: 'UPDATE',
        entity: 'BALANCE',
        entityId: dto.accountId,
        amount: dto.newBalance,
        currency: dto.currency,
        previousValue: previousBalance,
        newValue: dto.newBalance,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        metadata: {
          source: dto.source,
          changeAmount: dto.newBalance - previousBalance,
          changePercent: ((dto.newBalance - previousBalance) / previousBalance) * 100
        }
      });

      if (dto.currency !== 'ZAR') {
        this.logger.logZARCurrencyOperation(
          'BALANCE_UPDATE_FOREIGN',
          dto.newBalance,
          dto.currency,
          undefined,
          userId
        );
      }

      const balanceUpdate = {
        accountId: dto.accountId,
        previousBalance,
        newBalance: dto.newBalance,
        changeAmount: dto.newBalance - previousBalance,
        changePercent: ((dto.newBalance - previousBalance) / previousBalance) * 100,
        currency: dto.currency,
        source: dto.source,
        updatedAt: new Date()
      };

      const duration = Date.now() - startTime;
      this.logger.logPerformanceMetric('BALANCE_UPDATE', duration, 'ms', 'FinancialService');

      this.logger.log(`Account balance updated: ${dto.accountId}`, 'FinancialService');
      
      return balanceUpdate;
    } catch (error) {
      this.logger.error(`Failed to update account balance: ${error.message}`, error.stack, 'FinancialService');
      throw error;
    }
  }

  async calculateNetWorth(userId: string): Promise<NetWorthMetrics> {
    const startTime = Date.now();
    
    try {
      const netWorthData = {
        current: 239625,
        target: 1800000,
        progress: 13.3,
        liquidCash: 88750,
        investments: 142000,
        businessEquity: 8875,
        totalAssets: 239625,
        totalLiabilities: 0
      };

      const previousNetWorth = await this.getPreviousNetWorth(userId);
      
      if (previousNetWorth && previousNetWorth !== netWorthData.current) {
        this.logger.logNetWorthUpdate(
          userId,
          previousNetWorth,
          netWorthData.current,
          netWorthData.current - previousNetWorth,
          ((netWorthData.current - previousNetWorth) / previousNetWorth) * 100
        );
      }

      this.logger.logGoalProgress(
        'net_worth_goal',
        userId,
        netWorthData.current,
        netWorthData.target,
        netWorthData.progress
      );

      const duration = Date.now() - startTime;
      this.logger.logPerformanceMetric('NET_WORTH_CALCULATION', duration, 'ms', 'FinancialService');

      this.logger.log(`Net worth calculated for user: ${userId}`, 'FinancialService');
      
      return netWorthData;
    } catch (error) {
      this.logger.error(`Failed to calculate net worth: ${error.message}`, error.stack, 'FinancialService');
      throw error;
    }
  }

  async log43V3RRevenue(amount: number, source: string, description?: string) {
    try {
      this.logger.log43V3RRevenue(amount, source, description);
      
      const dailyTarget = 4881;
      const achievementPercent = (amount / dailyTarget) * 100;
      
      this.logger.logDailyRevenueTarget(amount, dailyTarget, achievementPercent);
      
      this.logger.logBusinessMetric({
        metric: '43V3R_REVENUE',
        value: amount,
        currency: 'ZAR',
        timestamp: new Date(),
        source: 'MANUAL',
        metadata: {
          source,
          description,
          dailyTarget,
          achievementPercent
        }
      });

      this.logger.log(`43V3R revenue logged: R${amount} from ${source}`, 'FinancialService');
      
      return { amount, source, description, dailyTarget, achievementPercent };
    } catch (error) {
      this.logger.error(`Failed to log 43V3R revenue: ${error.message}`, error.stack, 'FinancialService');
      throw error;
    }
  }

  async updateMRRProgress(currentMRR: number) {
    try {
      const targetMRR = 147917;
      const progressPercent = (currentMRR / targetMRR) * 100;
      
      this.logger.logMRRProgress(currentMRR, targetMRR, progressPercent);
      
      this.logger.logBusinessMetric({
        metric: '43V3R_MRR',
        value: currentMRR,
        currency: 'ZAR',
        timestamp: new Date(),
        source: 'AUTOMATED',
        metadata: {
          targetMRR,
          progressPercent
        }
      });

      this.logger.log(`MRR progress updated: R${currentMRR} (${progressPercent.toFixed(1)}% of target)`, 'FinancialService');
      
      return { currentMRR, targetMRR, progressPercent };
    } catch (error) {
      this.logger.error(`Failed to update MRR progress: ${error.message}`, error.stack, 'FinancialService');
      throw error;
    }
  }

  private async getAccountBalance(accountId: string): Promise<number> {
    return 50000;
  }

  private async getPreviousNetWorth(userId: string): Promise<number | null> {
    return 235000;
  }
}