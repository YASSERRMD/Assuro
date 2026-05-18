import { typedFetch } from '@/lib/api'

export interface AuditEntry {
  id: string
  action: string
  actor_email: string
  resource_type: string
  resource_id: string
  details: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface AuditFilters {
  action?: string
  actor_email?: string
  from?: string
  to?: string
  page?: string
  limit?: string
}

export async function listAuditEntries(filters?: AuditFilters): Promise<AuditEntry[]> {
  const params: Record<string, string> = {}
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
  }
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
  return typedFetch<AuditEntry[]>(`/v1/audit${qs}`)
}

export async function exportAuditLog(filters?: AuditFilters): Promise<Blob> {
  const params: Record<string, string> = {}
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
  }
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'
  const token = typeof window !== 'undefined' ? localStorage.getItem('assuro_token') : null
  const res = await fetch(`${API_BASE}/v1/audit/export${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.blob()
}

export async function listAuditActions(): Promise<string[]> {
  return typedFetch<string[]>('/v1/audit/actions')
}
