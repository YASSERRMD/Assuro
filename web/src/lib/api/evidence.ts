import { typedFetch } from '@/lib/api'

export interface Evidence {
  id: string
  org_id: string
  title: string
  file_key: string
  content_hash: string
  mime_type: string
  size_bytes: number
  created_at: string
}

export async function listEvidence(targetType?: string, targetId?: string): Promise<Evidence[]> {
  const params = new URLSearchParams()
  if (targetType) params.set('target_type', targetType)
  if (targetId) params.set('target_id', targetId)
  const qs = params.toString() ? '?' + params.toString() : ''
  return typedFetch<Evidence[]>(`/v1/evidence${qs}`)
}

export async function uploadEvidence(formData: FormData): Promise<Evidence> {
  return typedFetch<Evidence>('/v1/evidence', { method: 'POST', body: formData })
}
