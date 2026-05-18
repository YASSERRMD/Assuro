import { typedFetch } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('assuro_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function exportOrg(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/v1/export/org`, { headers: getAuthHeaders() })
  return res.blob()
}

export async function exportAssetsCSV(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/v1/export/assets/csv`, { headers: getAuthHeaders() })
  return res.blob()
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export async function importAssets(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return typedFetch<ImportResult>('/v1/import/assets', { method: 'POST', body: formData })
}

export async function importVendors(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return typedFetch<ImportResult>('/v1/import/vendors', { method: 'POST', body: formData })
}
