import { typedFetch } from '@/lib/api'

export interface Report {
  generated_at: string
  asset_id: string
  framework_key: string
  risk_tier: string
  risk_score: number
  risk_factors: Array<{ code: string; description: string; weight: number }>
  content_hash: string
}

export async function getReport(assetId: string, framework: string, format: string): Promise<Report | string> {
  const params = new URLSearchParams({ framework, format })
  return typedFetch<Report | string>(`/v1/assets/${assetId}/report?${params}`)
}
