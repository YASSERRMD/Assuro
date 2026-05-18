import { typedFetch } from '@/lib/api'

export interface Connector {
  id: string
  name: string
  connector_type: string
  status: string
  config: Record<string, unknown>
  last_synced_at?: string
  created_at: string
  updated_at: string
}

export interface ConnectorSync {
  id: string
  connector_id: string
  status: string
  records_synced: number
  started_at: string
  completed_at?: string
  error?: string
}

export async function listConnectors(): Promise<Connector[]> {
  return typedFetch<Connector[]>('/v1/connectors')
}

export async function createConnector(data: Partial<Connector>): Promise<Connector> {
  return typedFetch<Connector>('/v1/connectors', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateConnector(id: string, data: Partial<Connector>): Promise<Connector> {
  return typedFetch<Connector>(`/v1/connectors/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteConnector(id: string): Promise<void> {
  return typedFetch<void>(`/v1/connectors/${id}`, { method: 'DELETE' })
}

export async function listConnectorSyncs(id: string): Promise<ConnectorSync[]> {
  return typedFetch<ConnectorSync[]>(`/v1/connectors/${id}/sync`)
}

export async function triggerConnectorSync(id: string): Promise<ConnectorSync> {
  return typedFetch<ConnectorSync>(`/v1/connectors/${id}/sync`, { method: 'POST' })
}

export async function triggerConnectorScan(id: string): Promise<void> {
  return typedFetch<void>(`/v1/connectors/${id}/scan`, { method: 'POST' })
}
