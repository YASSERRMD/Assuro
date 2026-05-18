import { typedFetch } from '@/lib/api'

export interface Agent {
  id: string
  name: string
  description: string
  status: string
  asset_id?: string
  created_at: string
  updated_at: string
}

export interface AgentPermission {
  id: string
  agent_id: string
  permission: string
  granted: boolean
}

export interface AgentBehavior {
  id: string
  agent_id: string
  behavior_type: string
  config: Record<string, unknown>
  created_at: string
}

export interface AgentAnomaly {
  id: string
  agent_id: string
  description: string
  severity: string
  detected_at: string
}

export interface Guardrail {
  id: string
  name: string
  description: string
  rule_type: string
  config: Record<string, unknown>
  enabled: boolean
  created_at: string
  updated_at: string
}

export async function listAgents(): Promise<Agent[]> {
  return typedFetch<Agent[]>('/v1/agents')
}

export async function getAgent(id: string): Promise<Agent> {
  return typedFetch<Agent>(`/v1/agents/${id}`)
}

export async function createAgent(data: Partial<Agent>): Promise<Agent> {
  return typedFetch<Agent>('/v1/agents', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
  return typedFetch<Agent>(`/v1/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function killAgent(id: string): Promise<void> {
  return typedFetch<void>(`/v1/agents/${id}/kill`, { method: 'POST' })
}

export async function listAgentPermissions(id: string): Promise<AgentPermission[]> {
  return typedFetch<AgentPermission[]>(`/v1/agents/${id}/permissions`)
}

export async function addAgentPermission(id: string, data: Partial<AgentPermission>): Promise<AgentPermission> {
  return typedFetch<AgentPermission>(`/v1/agents/${id}/permissions`, { method: 'POST', body: JSON.stringify(data) })
}

export async function getAgentBehavior(id: string): Promise<AgentBehavior[]> {
  return typedFetch<AgentBehavior[]>(`/v1/agents/${id}/behavior`)
}

export async function setAgentBehavior(id: string, data: Partial<AgentBehavior>): Promise<AgentBehavior> {
  return typedFetch<AgentBehavior>(`/v1/agents/${id}/behavior`, { method: 'POST', body: JSON.stringify(data) })
}

export async function listAgentAnomalies(id: string): Promise<AgentAnomaly[]> {
  return typedFetch<AgentAnomaly[]>(`/v1/agents/${id}/anomalies`)
}

export async function reportAgentAnomaly(id: string, data: Partial<AgentAnomaly>): Promise<AgentAnomaly> {
  return typedFetch<AgentAnomaly>(`/v1/agents/${id}/anomalies`, { method: 'POST', body: JSON.stringify(data) })
}

// Guardrails
export async function listGuardrails(): Promise<Guardrail[]> {
  return typedFetch<Guardrail[]>('/v1/guardrails')
}

export async function createGuardrail(data: Partial<Guardrail>): Promise<Guardrail> {
  return typedFetch<Guardrail>('/v1/guardrails', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateGuardrail(id: string, data: Partial<Guardrail>): Promise<Guardrail> {
  return typedFetch<Guardrail>(`/v1/guardrails/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}
