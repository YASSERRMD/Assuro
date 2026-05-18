import { typedFetch } from '@/lib/api'

export interface ApprovalWorkflow {
  id: string
  name: string
  description: string
  steps: Array<{ step: number; approver_role: string }>
  created_at: string
  updated_at: string
}

export interface ApprovalRequest {
  id: string
  workflow_id: string
  workflow_name?: string
  subject: string
  description: string
  status: string
  requester_email?: string
  created_at: string
  updated_at: string
}

export interface ApprovalDecision {
  id: string
  request_id: string
  decision: string
  notes?: string
  decided_by: string
  decided_at: string
}

export async function listApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
  return typedFetch<ApprovalWorkflow[]>('/v1/approval-workflows')
}

export async function createApprovalWorkflow(data: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
  return typedFetch<ApprovalWorkflow>('/v1/approval-workflows', { method: 'POST', body: JSON.stringify(data) })
}

export async function listApprovalRequests(): Promise<ApprovalRequest[]> {
  return typedFetch<ApprovalRequest[]>('/v1/approval-requests')
}

export async function createApprovalRequest(data: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
  return typedFetch<ApprovalRequest>('/v1/approval-requests', { method: 'POST', body: JSON.stringify(data) })
}

export async function decideApprovalRequest(id: string, decision: string, notes?: string): Promise<ApprovalDecision> {
  return typedFetch<ApprovalDecision>(`/v1/approval-requests/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify({ decision, notes }),
  })
}

export async function listApprovalDecisions(id: string): Promise<ApprovalDecision[]> {
  return typedFetch<ApprovalDecision[]>(`/v1/approval-requests/${id}/decisions`)
}
