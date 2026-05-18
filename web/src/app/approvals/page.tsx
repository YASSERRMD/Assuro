'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import {
  listApprovalRequests,
  createApprovalRequest,
  decideApprovalRequest,
  listApprovalWorkflows,
  type ApprovalRequest,
  type ApprovalWorkflow,
} from '@/lib/api/approvals'
import { GitPullRequest, Plus, X, Check, XCircle } from 'lucide-react'

type Tab = 'requests' | 'workflows'

const statusBadge: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
}

function CreateRequestModal({ workflows, onClose, onCreated }: {
  workflows: ApprovalWorkflow[]
  onClose: () => void
  onCreated: (r: ApprovalRequest) => void
}) {
  const { toast } = useToast()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [workflowId, setWorkflowId] = useState(workflows[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const req = await createApprovalRequest({ subject, description, workflow_id: workflowId, status: 'pending' })
      toast('Approval request submitted.', 'success')
      onCreated(req)
    } catch {
      toast('Failed to submit request.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Submit Approval Request</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input
              className="input-base"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What requires approval?"
              required
            />
          </div>
          {workflows.length > 0 && (
            <div>
              <label className="label">Workflow</label>
              <select
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                className="input-base"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details and context..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<Tab>('requests')

  useEffect(() => {
    Promise.all([
      listApprovalRequests().catch(() => [] as ApprovalRequest[]),
      listApprovalWorkflows().catch(() => [] as ApprovalWorkflow[]),
    ]).then(([reqs, wfs]) => { setRequests(reqs); setWorkflows(wfs) })
      .finally(() => setLoading(false))
  }, [])

  const handleDecide = async (id: string, decision: string): Promise<void> => {
    try {
      await decideApprovalRequest(id, decision)
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: decision } : r))
      toast(`Request ${decision}.`, 'success')
    } catch {
      toast('Failed to record decision.', 'error')
    }
  }

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Review and decide on governance approval requests</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-nav mb-4 animate-in">
        {(['requests', 'workflows'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-item ${tab === t ? 'active' : ''}`}
          >
            {t === 'requests' ? (
              <>
                Requests
                {requests.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-bold">
                    {requests.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </>
            ) : 'Workflows'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-5 rounded-full w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests tab */}
      {!loading && tab === 'requests' && (
        <>
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <GitPullRequest className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No approval requests</p>
              <p className="empty-body">Submit a request to kick off an approval workflow.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Requester</th>
                    <th>Workflow</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <p className="font-medium text-gray-900">{req.subject}</p>
                        {req.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{req.description}</p>
                        )}
                      </td>
                      <td className="text-xs text-gray-500">{req.requester_email ?? '-'}</td>
                      <td className="text-xs text-gray-500">
                        {workflows.find((w) => w.id === req.workflow_id)?.name ?? '-'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[req.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="text-xs text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDecide(req.id, 'approved')}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                            >
                              <Check className="h-3 w-3" />Approve
                            </button>
                            <button
                              onClick={() => handleDecide(req.id, 'rejected')}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                            >
                              <XCircle className="h-3 w-3" />Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Workflows tab */}
      {!loading && tab === 'workflows' && (
        <>
          {workflows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <GitPullRequest className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No workflows configured</p>
              <p className="empty-body">Create approval workflows via the API.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Description</th>
                    <th>Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((wf) => (
                    <tr key={wf.id}>
                      <td className="font-medium text-gray-900">{wf.name}</td>
                      <td className="text-xs text-gray-500">{wf.description ?? '-'}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(wf.steps ?? []).map((step) => (
                            <span
                              key={step.step}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-violet-100 text-violet-700"
                            >
                              Step {step.step}: {step.approver_role}
                            </span>
                          ))}
                          {(!wf.steps || wf.steps.length === 0) && (
                            <span className="text-xs text-gray-400">No steps defined</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateRequestModal
          workflows={workflows}
          onClose={() => setShowCreate(false)}
          onCreated={(r) => { setRequests((prev) => [r, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
