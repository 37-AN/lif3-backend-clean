export interface BusinessStrategy {
  currentMRR: string;
  targetMRR: string;
  timeline: string;
  immediateFocus: string;
  serviceOfferings: Array<{ name: string; priceRange: string }>;
  targetMarket: string[];
  focus: string;
  technology: string;
  target: string;
  revenueModel: string;
  competitiveAdvantages: string[];
  generated: string;
} 