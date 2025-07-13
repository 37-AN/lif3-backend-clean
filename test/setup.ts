import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

// LIF3 Financial Dashboard Test Setup
// Optimized for MacBook M1 ARM64 architecture

// Financial constants for testing
export const LIF3_TEST_CONSTANTS = {
  CURRENT_NET_WORTH: 239625,
  TARGET_NET_WORTH: 1800000,
  GOAL_PROGRESS: 13.3,
  LIQUID_CASH: 88750,
  INVESTMENTS: 142000,
  BUSINESS_EQUITY: 8875,
  DAILY_REVENUE_TARGET: 4881,
  MRR_TARGET: 147917,
  CURRENCY: 'ZAR',
  USER_EMAIL: 'ethan@43v3r.ai',
  BUSINESS_NAME: '43V3R',
  GOOGLE_DRIVE_FOLDER: '1dD8C1e1hkcCPdtlqA3nsxJYWVvilV5Io'
};

// Test database configuration
export const TEST_DB_CONFIG = {
  type: 'postgres' as const,
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT) || 5433,
  username: process.env.TEST_DB_USERNAME || 'test_user',
  password: process.env.TEST_DB_PASSWORD || 'test_password',
  database: process.env.TEST_DB_NAME || 'lif3_test',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  dropSchema: true,
  logging: false
};

// Mock WebSocket client for real-time testing
export class MockWebSocketClient {
  public receivedEvents: any[] = [];
  public lastEvent: any = null;
  public connected = false;

  connect() {
    this.connected = true;
    return Promise.resolve();
  }

  disconnect() {
    this.connected = false;
    this.receivedEvents = [];
    this.lastEvent = null;
  }

  emit(event: string, data?: any) {
    if (this.connected) {
      this.receivedEvents.push({ event, data });
      this.lastEvent = { event, data };
    }
  }

  waitFor(event: string, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      const checkEvent = () => {
        const foundEvent = this.receivedEvents.find(e => e.event === event);
        if (foundEvent) {
          clearTimeout(timer);
          resolve(foundEvent);
        } else {
          setTimeout(checkEvent, 100);
        }
      };

      checkEvent();
    });
  }
}

// Mock Discord interaction for bot testing
export function createMockDiscordInteraction(commandName: string, options: any = {}) {
  return {
    commandName,
    options: {
      data: Object.entries(options).map(([name, value]) => ({ name, value }))
    },
    user: {
      id: 'test_discord_user',
      username: 'ethan_test',
      tag: 'ethan_test#1234'
    },
    guildId: 'test_guild_id',
    channelId: 'test_channel_id',
    reply: jest.fn().mockResolvedValue(true),
    followUp: jest.fn().mockResolvedValue(true),
    deferReply: jest.fn().mockResolvedValue(true)
  };
}

// JWT token generation for testing
export function generateTestJWT(payload: any = { userId: 'ethan_barnes', email: 'ethan@43v3r.ai' }) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
}

// Financial calculation utilities for testing
export class FinancialTestUtils {
  static calculateNetWorth(liquidCash: number, investments: number, businessEquity: number): number {
    return liquidCash + investments + businessEquity;
  }

  static calculateGoalProgress(current: number, target: number): number {
    return Math.round((current / target) * 100 * 10) / 10; // Round to 1 decimal place
  }

  static calculateRevenueProgress(current: number, target: number): number {
    return Math.round((current / target) * 100 * 10) / 10;
  }

  static calculateMRR(dailyRevenue: number): number {
    return Math.round(dailyRevenue * 30.33); // Average month
  }

  static validateZARAmount(amount: number): boolean {
    return typeof amount === 'number' && amount >= 0 && Number.isFinite(amount);
  }

  static formatZAR(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// Test data generators
export class TestDataGenerator {
  static generateTransaction(overrides: any = {}) {
    return {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: 1000,
      currency: 'ZAR',
      description: 'Test transaction',
      category: 'testing',
      type: 'expense',
      date: new Date(),
      userId: 'ethan_barnes',
      ...overrides
    };
  }

  static generateBusinessRevenue(overrides: any = {}) {
    return {
      amount: 1000,
      currency: 'ZAR',
      source: 'consulting',
      description: 'Test 43V3R revenue',
      date: new Date(),
      ...overrides
    };
  }

  static generateGoalData(overrides: any = {}) {
    return {
      id: 'goal_net_worth',
      name: 'Net Worth R1.8M',
      current: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
      target: LIF3_TEST_CONSTANTS.TARGET_NET_WORTH,
      progress: LIF3_TEST_CONSTANTS.GOAL_PROGRESS,
      deadline: '2025-12-31',
      ...overrides
    };
  }

  static generateFinancialSnapshot() {
    return {
      netWorth: LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH,
      liquidCash: LIF3_TEST_CONSTANTS.LIQUID_CASH,
      investments: LIF3_TEST_CONSTANTS.INVESTMENTS,
      businessEquity: LIF3_TEST_CONSTANTS.BUSINESS_EQUITY,
      monthlyIncome: 35000,
      monthlyExpenses: 15000,
      savingsRate: 57.1,
      timestamp: new Date()
    };
  }
}

// Performance monitoring for M1 MacBook
export class PerformanceMonitor {
  private static startTimes = new Map<string, number>();

  static start(label: string): void {
    this.startTimes.set(label, Date.now());
  }

  static end(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      throw new Error(`Performance monitor: No start time found for label "${label}"`);
    }
    const duration = Date.now() - startTime;
    this.startTimes.delete(label);
    return duration;
  }

  static async measure<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.start(label);
    const result = await fn();
    const duration = this.end(label);
    return { result, duration };
  }
}

// Log verification utilities
export class LogVerificationUtils {
  static async getAuditLogs(type: 'financial' | 'security' | 'business'): Promise<any[]> {
    // Mock implementation - in real tests, this would query the actual log files
    return [];
  }

  static async verifyLogEntry(expectedEntry: any, logType: string): Promise<boolean> {
    const logs = await this.getAuditLogs(logType as any);
    return logs.some(log => 
      Object.keys(expectedEntry).every(key => log[key] === expectedEntry[key])
    );
  }
}

// Global test setup
beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during testing
  console.log('🧪 Setting up LIF3 Financial Dashboard test suite...');
  console.log(`📊 Testing financial targets: R${LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH.toLocaleString()} → R${LIF3_TEST_CONSTANTS.TARGET_NET_WORTH.toLocaleString()}`);
  console.log(`🚀 Testing 43V3R revenue targets: R0 → R${LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET.toLocaleString()}/day`);
});

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up LIF3 test environment...');
});

// Export commonly used testing utilities
export {
  request,
  Test,
  TestingModule,
  INestApplication
};