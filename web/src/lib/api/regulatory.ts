import { typedFetch } from '@/lib/api'

export interface RegulatoryChange {
  id: string
  title: string
  description: string
  source: string
  jurisdiction: string
  effective_date?: string
  status: string
  created_at: string
  updated_at: string
}

export interface RegulatoryImpact {
  id: string
  change_id: string
  asset_id?: string
  description: string
  severity: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function listRegulatoryChanges(): Promise<RegulatoryChange[]> {
  return typedFetch<RegulatoryChange[]>('/v1/regulatory/changes')
}

export async function createRegulatoryChange(data: Partial<RegulatoryChange>): Promise<RegulatoryChange> {
  return typedFetch<RegulatoryChange>('/v1/regulatory/changes', { method: 'POST', body: JSON.stringify(data) })
}

export async function listRegulatoryImpacts(): Promise<RegulatoryImpact[]> {
  return typedFetch<RegulatoryImpact[]>('/v1/regulatory/impacts')
}

export async function createRegulatoryImpact(data: Partial<RegulatoryImpact>): Promise<RegulatoryImpact> {
  return typedFetch<RegulatoryImpact>('/v1/regulatory/impacts', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateRegulatoryImpact(id: string, data: Partial<RegulatoryImpact>): Promise<RegulatoryImpact> {
  return typedFetch<RegulatoryImpact>(`/v1/regulatory/impacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}
