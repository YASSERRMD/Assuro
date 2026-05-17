import { typedFetch } from '@/lib/api'

export interface Framework { id: string; key: string; name: string; version: string }
export interface Control { id: string; key: string; title: string; domain: string }
export interface Coverage { framework_key: string; total_requirements: number; covered_requirements: number; coverage_pct: number }
export interface ControlStatus { control_key: string; control_title: string; status: string; justification: string }

export async function listFrameworks(): Promise<Framework[]> {
  return typedFetch<Framework[]>('/v1/frameworks')
}

export async function listControls(): Promise<Control[]> {
  return typedFetch<Control[]>('/v1/controls')
}

export async function setControlStatus(assetId: string, controlId: string, status: string, justification: string): Promise<void> {
  await typedFetch(`/v1/assets/${assetId}/controls/status`, {
    method: 'POST',
    body: JSON.stringify({ control_id: controlId, status, justification }),
  })
}

export async function getCoverage(assetId: string): Promise<Coverage[]> {
  return typedFetch<Coverage[]>(`/v1/assets/${assetId}/coverage`)
}

export async function getSoA(assetId: string): Promise<ControlStatus[]> {
  return typedFetch<ControlStatus[]>(`/v1/assets/${assetId}/soa`)
}
