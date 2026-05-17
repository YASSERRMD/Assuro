import { typedFetch } from '@/lib/api'

export interface Incident {
  id: string
  org_id: string
  asset_id: string
  title: string
  description: string
  severity: string
  status: string
  raised_at: string
  closed_at?: string
}

export async function listIncidents(params?: Record<string, string>): Promise<Incident[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return typedFetch<Incident[]>(`/v1/incidents${qs}`)
}

export async function createIncident(data: {
  asset_id: string
  title: string
  description: string
  severity: string
}): Promise<Incident> {
  return typedFetch<Incident>('/v1/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
