import { typedFetch } from '@/lib/api'

export interface AISystem {
  id: string
  name: string
  asset_type: string
  description: string
  provider: string
  model_family: string
  modality: string
  deployment_context: string
  intended_purpose: string
  eu_market_exposure: boolean
  is_agentic: boolean
  autonomy_level: number
  lifecycle_status: string
  lifecycle_stage: string
  latest_risk_tier: string
}

export interface RiskAssessment {
  id: string
  asset_id: string
  tier: string
  score: number
  factors: Array<{ code: string; description: string; weight: number }>
  ruleset_version: string
  computed_at: string
}

export async function listAISystems(params?: Record<string, string>): Promise<AISystem[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return typedFetch<AISystem[]>(`/v1/ai-systems${qs}`)
}

export async function getAISystem(id: string): Promise<AISystem> {
  return typedFetch<AISystem>(`/v1/ai-systems/${id}`)
}

export async function registerAISystem(data: Partial<AISystem>): Promise<AISystem> {
  return typedFetch<AISystem>('/v1/ai-systems', { method: 'POST', body: JSON.stringify(data) })
}

export async function computeRisk(id: string): Promise<RiskAssessment> {
  return typedFetch<RiskAssessment>(`/v1/assets/${id}/risk/compute`, { method: 'POST' })
}

export async function getRisk(id: string): Promise<RiskAssessment | null> {
  try {
    return await typedFetch<RiskAssessment>(`/v1/assets/${id}/risk`)
  } catch {
    return null
  }
}

export async function getRiskHistory(id: string): Promise<RiskAssessment[]> {
  return typedFetch<RiskAssessment[]>(`/v1/assets/${id}/risk/history`)
}

export async function importAISystems(systems: Partial<AISystem>[]): Promise<AISystem[]> {
  return typedFetch<AISystem[]>('/v1/ai-systems/import', { method: 'POST', body: JSON.stringify(systems) })
}
