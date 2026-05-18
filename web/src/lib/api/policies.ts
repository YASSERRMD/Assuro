import { typedFetch } from '@/lib/api'

export interface Policy {
  id: string
  title: string
  description: string
  status: string
  version: string
  content: string
  owner_email?: string
  effective_date?: string
  review_date?: string
  created_at: string
  updated_at: string
}

export interface PolicyAttestation {
  id: string
  policy_id: string
  attested_by: string
  attested_at: string
  notes?: string
}

export async function listPolicies(): Promise<Policy[]> {
  return typedFetch<Policy[]>('/v1/policies')
}

export async function createPolicy(data: Partial<Policy>): Promise<Policy> {
  return typedFetch<Policy>('/v1/policies', { method: 'POST', body: JSON.stringify(data) })
}

export async function updatePolicyStatus(id: string, status: string): Promise<Policy> {
  return typedFetch<Policy>(`/v1/policies/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export async function updatePolicyContent(id: string, content: string): Promise<Policy> {
  return typedFetch<Policy>(`/v1/policies/${id}/content`, { method: 'PATCH', body: JSON.stringify({ content }) })
}

export async function attestPolicy(id: string, notes?: string): Promise<PolicyAttestation> {
  return typedFetch<PolicyAttestation>(`/v1/policies/${id}/attest`, { method: 'POST', body: JSON.stringify({ notes }) })
}

export async function listPolicyAttestations(id: string): Promise<PolicyAttestation[]> {
  return typedFetch<PolicyAttestation[]>(`/v1/policies/${id}/attestations`)
}
