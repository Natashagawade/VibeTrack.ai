import type {
  SignalStats,
  TrendPoint,
  IssueBucket,
  RecentSignal,
  RiskSummary,
} from "@/lib/intelligence/aggregate";

export interface OverviewData {
  orgName: string;
  stats: SignalStats;
  trend: TrendPoint[];
  issues: IssueBucket[];
  recent: RecentSignal[];
  risks: RiskSummary[];
  openActions: number;
  newInsights: number;
  generatedAt: string;
}