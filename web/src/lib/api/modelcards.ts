import { typedFetch } from '@/lib/api'

export interface ModelCard {
  id: string
  asset_id: string
  title: string
  description: string
  status: string
  version: string
  published: boolean
  published_at?: string
  intended_use: unknown
  out_of_scope_use: unknown
  limitations: unknown
  training_data: unknown
  evaluation_results: unknown
  created_at: string
  updated_at: string
}

export async function listModelCards(): Promise<ModelCard[]> {
  return typedFetch<ModelCard[]>('/v1/model-cards')
}

export async function createModelCard(data: Partial<ModelCard>): Promise<ModelCard> {
  return typedFetch<ModelCard>('/v1/model-cards', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateModelCard(id: string, data: Partial<ModelCard>): Promise<ModelCard> {
  return typedFetch<ModelCard>(`/v1/model-cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function publishModelCard(id: string): Promise<ModelCard> {
  return typedFetch<ModelCard>(`/v1/model-cards/${id}/publish`, { method: 'POST' })
}
