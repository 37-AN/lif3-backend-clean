import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import { Goal, GoalType, GoalStatus, GoalPriority } from '../entities/goal.entity';
import { BusinessMetrics, BusinessStage } from '../entities/business-metrics.entity';
import { NetWorthSnapshot } from '../entities/net-worth-snapshot.entity';
import { UserRole, Currency, Theme, AccountType, AccountProvider } from '../entities/enums';
import * as bcrypt from 'bcryptjs';

export async function seedFreshStart(dataSource: DataSource) {
  console.log('🌱 Starting LIF3 Fresh Start Database Seeding...');
  
  const userRepository = dataSource.getRepository(User);
  const accountRepository = dataSource.getRepository(Account);
  const goalRepository = dataSource.getRepository(Goal);
  const businessMetricsRepository = dataSource.getRepository(BusinessMetrics);
  const netWorthSnapshotRepository = dataSource.getRepository(NetWorthSnapshot);

  // Clear existing data for fresh start
  await businessMetricsRepository.clear();
  await netWorthSnapshotRepository.clear();
  await goalRepository.clear();
  await accountRepository.clear();
  await userRepository.clear();

  console.log('🔄 Cleared existing data for fresh start');

  // Create Ethan Barnes user with R0 starting values
  const hashedPassword = await bcrypt.hash('lif3_secure_pass', 10);
  
  const user = userRepository.create({
    email: 'ethan@43v3r.ai',
    firstName: 'Ethan',
    lastName: 'Barnes',
    password: hashedPassword,
    role: UserRole.ADMIN,
    isActive: true,
    netWorth: 0,
    liquidCash: 0,
    investments: 0,
    businessEquity: 0,
    targetNetWorth: 1800000,
    preferences: {
      currency: Currency.ZAR,
      theme: Theme.DARK,
      notifications: true,
      timezone: 'Africa/Johannesburg',
    },
  });
  
  const savedUser = await userRepository.save(user);
  console.log('👤 Created Ethan Barnes user with R0 starting values');

  // Create basic accounts with R0 balances
  const accounts = [
    {
      name: 'FNB Cheque Account',
      type: AccountType.CHECKING,
      provider: AccountProvider.FNB,
      accountNumber: '1234567890',
      currency: Currency.ZAR,
      currentBalance: 0,
      availableBalance: 0,
      isActive: true,
      isConnected: false,
      userId: savedUser.id,
    },
    {
      name: 'FNB Savings Account',
      type: AccountType.SAVINGS,
      provider: AccountProvider.FNB,
      accountNumber: '0987654321',
      currency: Currency.ZAR,
      currentBalance: 0,
      availableBalance: 0,
      isActive: true,
      isConnected: false,
      userId: savedUser.id,
    },
    {
      name: 'Easy Equities',
      type: AccountType.INVESTMENT,
      provider: AccountProvider.EASY_EQUITIES,
      currency: Currency.ZAR,
      currentBalance: 0,
      availableBalance: 0,
      isActive: true,
      isConnected: false,
      userId: savedUser.id,
    },
    {
      name: '43V3R Business Account',
      type: AccountType.BUSINESS,
      provider: AccountProvider.MANUAL,
      currency: Currency.ZAR,
      currentBalance: 0,
      availableBalance: 0,
      isActive: true,
      isConnected: false,
      userId: savedUser.id,
    },
  ];

  const savedAccounts = await accountRepository.save(accounts);
  console.log('🏦 Created 4 accounts with R0 balances');

  // Create fresh start goals
  const goals = [
    {
      name: 'Net Worth R1.8M Goal',
      description: 'Fresh start journey from R0 to R1,800,000 net worth in 18 months',
      type: GoalType.NET_WORTH,
      targetAmount: 1800000,
      currentAmount: 0,
      currency: Currency.ZAR,
      deadline: new Date('2026-12-31'),
      status: GoalStatus.ACTIVE,
      priority: GoalPriority.CRITICAL,
      monthlyTarget: 100000,
      weeklyTarget: 25000,
      dailyTarget: 3571,
      userId: savedUser.id,
      notes: 'Ultimate 18-month wealth building goal starting from absolute zero',
    },
    {
      name: 'Emergency Fund R50,000',
      description: 'First major milestone - Emergency fund of R50,000',
      type: GoalType.EMERGENCY_FUND,
      targetAmount: 50000,
      currentAmount: 0,
      currency: Currency.ZAR,
      deadline: new Date('2025-10-06'),
      status: GoalStatus.ACTIVE,
      priority: GoalPriority.HIGH,
      monthlyTarget: 16667,
      weeklyTarget: 4167,
      dailyTarget: 595,
      userId: savedUser.id,
      notes: 'Critical first milestone - financial security foundation',
    },
    {
      name: '43V3R Daily Revenue R4,881',
      description: '43V3R business daily revenue target',
      type: GoalType.BUSINESS_REVENUE,
      targetAmount: 4881,
      currentAmount: 0,
      currency: Currency.ZAR,
      deadline: new Date('2025-12-31'),
      status: GoalStatus.ACTIVE,
      priority: GoalPriority.HIGH,
      monthlyTarget: 147917,
      weeklyTarget: 34167,
      dailyTarget: 4881,
      userId: savedUser.id,
      notes: 'AI + Web3 + Crypto + Quantum business daily revenue target',
    },
    {
      name: 'Investment Portfolio R200,000',
      description: 'Build diversified investment portfolio',
      type: GoalType.INVESTMENT,
      targetAmount: 200000,
      currentAmount: 0,
      currency: Currency.ZAR,
      deadline: new Date('2026-06-30'),
      status: GoalStatus.ACTIVE,
      priority: GoalPriority.MEDIUM,
      monthlyTarget: 18182,
      weeklyTarget: 4545,
      dailyTarget: 649,
      userId: savedUser.id,
      notes: 'Long-term wealth building through diversified investments',
    },
  ];

  const savedGoals = await goalRepository.save(goals);
  console.log('🎯 Created 4 fresh start goals');

  // Create initial business metrics (43V3R)
  const businessMetrics = businessMetricsRepository.create({
    businessName: '43V3R',
    date: new Date(),
    dailyRevenue: 0,
    monthlyRecurringRevenue: 0,
    pipelineValue: 0,
    activeUsers: 0,
    activeClients: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    targetDailyRevenue: 4881,
    targetMonthlyRevenue: 147917,
    stage: BusinessStage.FOUNDATION,
    currency: Currency.ZAR,
    metrics: {
      conversionRate: 0,
      customerAcquisitionCost: 0,
      lifetimeValue: 0,
      churnRate: 0,
      growthRate: 0,
      burnRate: 0,
      runway: 0,
    },
    serviceBreakdown: {
      ai: 0,
      web3: 0,
      crypto: 0,
      quantum: 0,
      consulting: 0,
      other: 0,
    },
    userId: savedUser.id,
    notes: 'Day 1 - Foundation building phase for 43V3R AI business',
  });

  const savedBusinessMetrics = await businessMetricsRepository.save(businessMetrics);
  console.log('📊 Created 43V3R business metrics starting from R0');

  // Create initial net worth snapshot
  const netWorthSnapshot = netWorthSnapshotRepository.create({
    netWorth: 0,
    liquidCash: 0,
    investments: 0,
    businessEquity: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    targetNetWorth: 1800000,
    progressPercentage: 0,
    currency: Currency.ZAR,
    breakdown: {
      accounts: savedAccounts.map(account => ({
        accountId: account.id,
        accountName: account.name,
        balance: 0,
      })),
      investments: [],
      business: {
        dailyRevenue: 0,
        mrr: 0,
        valuation: 0,
      },
    },
    userId: savedUser.id,
    notes: 'Fresh start baseline - beginning the journey from R0 to R1,800,000',
  });

  const savedSnapshot = await netWorthSnapshotRepository.save(netWorthSnapshot);
  console.log('📈 Created initial net worth snapshot: R0 baseline');

  console.log('✅ Fresh Start Database Seeding Complete!');
  console.log('🎯 Ready to track journey from R0 → R1,800,000');
  console.log('🚀 43V3R business tracking initialized');
  console.log('📊 All automation systems ready for fresh start');
  
  return {
    user: savedUser,
    accounts: savedAccounts,
    goals: savedGoals,
    businessMetrics: savedBusinessMetrics,
    netWorthSnapshot: savedSnapshot,
  };
}