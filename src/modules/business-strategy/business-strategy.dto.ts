export class BusinessStrategyDto {
  // Technology
  currentMRR: string;
  targetMRR: string;
  timeline: string;
  immediateFocus: string;
  serviceOfferings: Array<{ name: string; priceRange: string }>;
  targetMarket: string[];

  // Brand
  focus: string;
  technology: string;
  target: string;
  revenueModel: string;
  competitiveAdvantages: string[];

  // Metadata
  generated: string;
} 