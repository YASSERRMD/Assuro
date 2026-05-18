'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
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

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'pending') return 'warning'
  return 'default'
}

type Tab = 'requests' | 'workflows'

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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Submit Approval Request</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="What requires approval?" required />
          {workflows.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Workflow</label>
              <select value={workflowId} onChange={(e) => setWorkflowId(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
                {workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Details and context..." rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="mt-0.5 text-sm text-gray-500">Review and decide on governance approval requests</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-gray-200">
        {(['requests', 'workflows'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-4 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t ? 'border-[#0f1f3d] text-[#0f1f3d]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'requests' ? 'Requests' : 'Workflows'}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <div className="mt-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-5 w-56 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          )}

          {!loading && requests.length === 0 && (
            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <GitPullRequest className="h-8 w-8 text-violet-200" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700">No approval requests</p>
                <p className="mt-1 text-sm text-gray-400">Submit a request to kick off an approval workflow.</p>
              </div>
            </div>
          )}

          {!loading && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card key={req.id} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 mt-0.5">
                    <GitPullRequest className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{req.subject}</p>
                      <Badge variant={statusVariant(req.status)} className="capitalize">{req.status}</Badge>
                    </div>
                    {req.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{req.description}</p>
                    )}
                    {req.requester_email && (
                      <p className="mt-1 text-xs text-gray-400">By {req.requester_email}</p>
                    )}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDecide(req.id, 'approved')}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        <Check className="h-3 w-3" />Approve
                      </button>
                      <button
                        onClick={() => handleDecide(req.id, 'rejected')}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        <XCircle className="h-3 w-3" />Reject
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'workflows' && (
        <div className="mt-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </Card>
              ))}
            </div>
          )}
          {!loading && workflows.length === 0 && (
            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <GitPullRequest className="h-8 w-8 text-violet-200" />
              </div>
              <p className="text-base font-semibold text-gray-700">No workflows configured</p>
              <p className="text-sm text-gray-400">Create approval workflows via the API.</p>
            </div>
          )}
          {!loading && workflows.length > 0 && (
            <div className="space-y-3">
              {workflows.map((wf) => (
                <Card key={wf.id} className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{wf.name}</p>
                    {wf.description && (
                      <p className="mt-1 text-xs text-gray-500">{wf.description}</p>
                    )}
                    {wf.steps && wf.steps.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {wf.steps.map((step) => (
                          <Badge key={step.step} variant="outline" className="text-[10px]">
                            Step {step.step}: {step.approver_role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
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
