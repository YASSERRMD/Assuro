import { typedFetch } from '@/lib/api'

export interface AnalyticsDashboard {
  total_ai_systems: number
  total_agents: number
  open_incidents: number
  pending_approvals: number
  compliance_score: number
  risk_by_tier: Record<string, number>
  incidents_by_severity: Record<string, number>
}

export interface RiskTrendPoint {
  date: string
  high: number
  medium: number
  low: number
  score: number
}

interface StatsResponse {
  total_ai_systems: number
  by_risk_tier: Record<string, number>
  open_incidents: number
  completed_assessments: number
  framework_coverage: Array<{ framework_key: string; coverage_pct: number }>
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const stats = await typedFetch<StatsResponse>('/v1/stats')
  return {
    total_ai_systems: stats.total_ai_systems ?? 0,
    total_agents: 0,
    open_incidents: stats.open_incidents ?? 0,
    pending_approvals: 0,
    compliance_score: stats.framework_coverage?.length
      ? Math.round(stats.framework_coverage.reduce((s, f) => s + (f.coverage_pct ?? 0), 0) / stats.framework_coverage.length)
      : 0,
    risk_by_tier: stats.by_risk_tier ?? {},
    incidents_by_severity: {},
  }
}

export async function getRiskTrend(params?: Record<string, string>): Promise<RiskTrendPoint[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return typedFetch<RiskTrendPoint[]>(`/v1/analytics/risk-trend${qs}`)
}
