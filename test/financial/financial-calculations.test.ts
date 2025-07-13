import { FinancialTestUtils, LIF3_TEST_CONSTANTS } from '../setup';

describe('Financial Calculations - LIF3 Dashboard', () => {
  describe('Net Worth Calculations', () => {
    test('Net worth calculation accuracy with exact LIF3 values', () => {
      const liquidCash = LIF3_TEST_CONSTANTS.LIQUID_CASH;
      const investments = LIF3_TEST_CONSTANTS.INVESTMENTS;
      const businessEquity = LIF3_TEST_CONSTANTS.BUSINESS_EQUITY;
      const expectedNetWorth = LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH;
      
      const calculatedNetWorth = FinancialTestUtils.calculateNetWorth(
        liquidCash, 
        investments, 
        businessEquity
      );
      
      expect(calculatedNetWorth).toBe(expectedNetWorth);
      expect(calculatedNetWorth).toBe(239625); // R239,625
    });

    test('Net worth calculation with zero values', () => {
      const result = FinancialTestUtils.calculateNetWorth(0, 0, 0);
      expect(result).toBe(0);
    });

    test('Net worth calculation with large ZAR amounts', () => {
      const liquidCash = 500000; // R500k
      const investments = 1000000; // R1M
      const businessEquity = 300000; // R300k
      const expected = 1800000; // R1.8M (LIF3 target)
      
      const result = FinancialTestUtils.calculateNetWorth(
        liquidCash, 
        investments, 
        businessEquity
      );
      
      expect(result).toBe(expected);
    });

    test('Net worth calculation precision with decimals', () => {
      const liquidCash = 88750.50;
      const investments = 142000.75;
      const businessEquity = 8875.25;
      const expected = 239626.50;
      
      const result = FinancialTestUtils.calculateNetWorth(
        liquidCash, 
        investments, 
        businessEquity
      );
      
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  describe('Goal Progress Calculations', () => {
    test('Goal progress calculation (R1.8M target) - Current LIF3 status', () => {
      const current = LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH;
      const target = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      const expectedProgress = LIF3_TEST_CONSTANTS.GOAL_PROGRESS;
      
      const calculatedProgress = FinancialTestUtils.calculateGoalProgress(current, target);
      
      expect(calculatedProgress).toBeCloseTo(expectedProgress, 1);
      expect(calculatedProgress).toBeCloseTo(13.3, 1);
    });

    test('Goal progress at 0% (starting point)', () => {
      const current = 0;
      const target = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      
      const progress = FinancialTestUtils.calculateGoalProgress(current, target);
      
      expect(progress).toBe(0);
    });

    test('Goal progress at 100% (target achieved)', () => {
      const current = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      const target = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      
      const progress = FinancialTestUtils.calculateGoalProgress(current, target);
      
      expect(progress).toBe(100);
    });

    test('Goal progress at 50% milestone', () => {
      const current = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH / 2; // R900k
      const target = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      
      const progress = FinancialTestUtils.calculateGoalProgress(current, target);
      
      expect(progress).toBeCloseTo(50.0, 1);
    });

    test('Goal progress beyond 100% (over-achievement)', () => {
      const current = 2000000; // R2M
      const target = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      
      const progress = FinancialTestUtils.calculateGoalProgress(current, target);
      
      expect(progress).toBeCloseTo(111.1, 1);
    });
  });

  describe('43V3R Business Revenue Calculations', () => {
    test('43V3R daily revenue tracking - starting point', () => {
      const current = 0;
      const target = LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET;
      
      const progress = FinancialTestUtils.calculateRevenueProgress(current, target);
      
      expect(progress).toBe(0);
    });

    test('43V3R daily revenue - partial progress', () => {
      const current = 1000; // R1k revenue
      const target = LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET; // R4,881
      
      const progress = FinancialTestUtils.calculateRevenueProgress(current, target);
      
      expect(progress).toBeCloseTo(20.5, 1); // 1000/4881 * 100 ≈ 20.5%
    });

    test('43V3R daily revenue - target achieved', () => {
      const current = LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET;
      const target = LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET;
      
      const progress = FinancialTestUtils.calculateRevenueProgress(current, target);
      
      expect(progress).toBe(100);
    });

    test('43V3R daily revenue - exceeding target', () => {
      const current = 6000; // R6k revenue
      const target = LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET; // R4,881
      
      const progress = FinancialTestUtils.calculateRevenueProgress(current, target);
      
      expect(progress).toBeCloseTo(122.9, 1);
    });
  });

  describe('MRR (Monthly Recurring Revenue) Calculations', () => {
    test('MRR calculation for 43V3R target achievement', () => {
      const dailyRevenue = LIF3_TEST_CONSTANTS.DAILY_REVENUE_TARGET; // R4,881
      const expectedMRR = LIF3_TEST_CONSTANTS.MRR_TARGET; // R147,917
      
      const calculatedMRR = FinancialTestUtils.calculateMRR(dailyRevenue);
      
      // Allow for rounding differences (30.33 days average)
      expect(calculatedMRR).toBeCloseTo(expectedMRR, 0);
    });

    test('MRR calculation from zero daily revenue', () => {
      const dailyRevenue = 0;
      
      const mrr = FinancialTestUtils.calculateMRR(dailyRevenue);
      
      expect(mrr).toBe(0);
    });

    test('MRR calculation from partial daily revenue', () => {
      const dailyRevenue = 1000; // R1k per day
      const expectedMRR = Math.round(1000 * 30.33); // R30,330
      
      const mrr = FinancialTestUtils.calculateMRR(dailyRevenue);
      
      expect(mrr).toBe(expectedMRR);
    });

    test('MRR calculation precision', () => {
      const dailyRevenue = 2440.50; // Half of target
      const expectedMRR = Math.round(2440.50 * 30.33);
      
      const mrr = FinancialTestUtils.calculateMRR(dailyRevenue);
      
      expect(mrr).toBe(expectedMRR);
    });
  });

  describe('ZAR Currency Validation', () => {
    test('Valid ZAR amounts', () => {
      expect(FinancialTestUtils.validateZARAmount(0)).toBe(true);
      expect(FinancialTestUtils.validateZARAmount(100.50)).toBe(true);
      expect(FinancialTestUtils.validateZARAmount(239625)).toBe(true);
      expect(FinancialTestUtils.validateZARAmount(1800000)).toBe(true);
    });

    test('Invalid ZAR amounts', () => {
      expect(FinancialTestUtils.validateZARAmount(-100)).toBe(false);
      expect(FinancialTestUtils.validateZARAmount(NaN)).toBe(false);
      expect(FinancialTestUtils.validateZARAmount(Infinity)).toBe(false);
      expect(FinancialTestUtils.validateZARAmount(-Infinity)).toBe(false);
    });

    test('ZAR formatting', () => {
      expect(FinancialTestUtils.formatZAR(239625)).toBe('R239,625.00');
      expect(FinancialTestUtils.formatZAR(1800000)).toBe('R1,800,000.00');
      expect(FinancialTestUtils.formatZAR(4881)).toBe('R4,881.00');
      expect(FinancialTestUtils.formatZAR(0)).toBe('R0.00');
      expect(FinancialTestUtils.formatZAR(100.5)).toBe('R100.50');
    });
  });

  describe('Financial Milestones', () => {
    test('Identify net worth milestones', () => {
      const milestones = [250000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 1800000];
      const current = LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH;
      
      const nextMilestone = milestones.find(milestone => milestone > current);
      const progress = FinancialTestUtils.calculateGoalProgress(current, nextMilestone!);
      
      expect(nextMilestone).toBe(250000); // Next milestone: R250k
      expect(progress).toBeCloseTo(95.9, 1); // Very close to R250k milestone
    });

    test('Calculate time to reach R1.8M target', () => {
      const current = LIF3_TEST_CONSTANTS.CURRENT_NET_WORTH;
      const target = LIF3_TEST_CONSTANTS.TARGET_NET_WORTH;
      const remaining = target - current;
      const monthlyGrowthRate = 15000; // Assumed R15k/month growth
      
      const monthsToTarget = Math.ceil(remaining / monthlyGrowthRate);
      
      expect(remaining).toBe(1560375); // R1,560,375 remaining
      expect(monthsToTarget).toBe(105); // ~8.7 years at R15k/month
    });
  });

  describe('Savings Rate Calculations', () => {
    test('Calculate savings rate from financial data', () => {
      const monthlyIncome = 35000; // R35k
      const monthlyExpenses = 15000; // R15k
      const savings = monthlyIncome - monthlyExpenses;
      const savingsRate = (savings / monthlyIncome) * 100;
      
      expect(savings).toBe(20000); // R20k saved
      expect(savingsRate).toBeCloseTo(57.1, 1); // 57.1% savings rate
    });

    test('Optimal savings rate for R1.8M goal', () => {
      const monthlyIncome = 35000;
      const targetSavings = 25000; // R25k to accelerate goal
      const optimalSavingsRate = (targetSavings / monthlyIncome) * 100;
      
      expect(optimalSavingsRate).toBeCloseTo(71.4, 1);
    });
  });

  describe('Investment Growth Projections', () => {
    test('Project investment growth at 8% annual return', () => {
      const currentInvestments = LIF3_TEST_CONSTANTS.INVESTMENTS;
      const annualReturnRate = 0.08; // 8%
      const years = 5;
      
      const futureValue = currentInvestments * Math.pow(1 + annualReturnRate, years);
      
      expect(futureValue).toBeCloseTo(208699, 0); // ~R208k after 5 years
    });

    test('Monthly investment contribution impact', () => {
      const currentInvestments = LIF3_TEST_CONSTANTS.INVESTMENTS;
      const monthlyContribution = 5000; // R5k/month
      const months = 12;
      const totalContributions = monthlyContribution * months;
      
      const projectedTotal = currentInvestments + totalContributions;
      
      expect(totalContributions).toBe(60000); // R60k per year
      expect(projectedTotal).toBe(202000); // R202k total
    });
  });
});