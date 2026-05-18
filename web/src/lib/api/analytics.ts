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

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  return typedFetch<AnalyticsDashboard>('/v1/analytics/dashboard')
}

export async function getRiskTrend(params?: Record<string, string>): Promise<RiskTrendPoint[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return typedFetch<RiskTrendPoint[]>(`/v1/analytics/risk-trend${qs}`)
}
