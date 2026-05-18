'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listPolicies, createPolicy, updatePolicyStatus, attestPolicy, type Policy } from '@/lib/api/policies'
import { FileCheck, Plus, X, ShieldCheck } from 'lucide-react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'active' || status === 'approved') return 'success'
  if (status === 'draft') return 'warning'
  if (status === 'archived') return 'default'
  if (status === 'under_review') return 'info'
  return 'default'
}

function CreatePolicyModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (p: Policy) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const policy = await createPolicy({ title, description, content, status: 'draft', version: '1.0' })
      toast('Policy created.', 'success')
      onCreated(policy)
    } catch {
      toast('Failed to create policy.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Policy</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Policy title" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Policy summary..." rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Policy content..." rows={5}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create Policy'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PoliciesPage() {
  const { toast } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    listPolicies()
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAttest = async (id: string): Promise<void> => {
    try {
      await attestPolicy(id)
      toast('Policy attested.', 'success')
    } catch {
      toast('Failed to attest policy.', 'error')
    }
  }

  const handlePublish = async (policy: Policy): Promise<void> => {
    try {
      const updated = await updatePolicyStatus(policy.id, 'active')
      setPolicies((prev) => prev.map((p) => p.id === policy.id ? updated : p))
      toast('Policy published.', 'success')
    } catch {
      toast('Failed to publish policy.', 'error')
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policies</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage AI governance policies and attestations</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-56 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      )}

      {!loading && policies.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <FileCheck className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No policies yet</p>
            <p className="mt-1 text-sm text-gray-400">Create governance policies for your AI systems.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Create Policy
          </Button>
        </div>
      )}

      {!loading && policies.length > 0 && (
        <div className="mt-6 space-y-3">
          {policies.map((policy) => (
            <Card key={policy.id} className="flex items-start gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d]/5 mt-0.5">
                <FileCheck className="h-4 w-4 text-[#0f1f3d]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{policy.title}</p>
                  <Badge variant="outline" className="text-[10px]">v{policy.version}</Badge>
                  <Badge variant={statusVariant(policy.status)} className="capitalize">{policy.status.replace(/_/g, ' ')}</Badge>
                </div>
                {policy.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{policy.description}</p>
                )}
                {policy.owner_email && (
                  <p className="mt-1 text-xs text-gray-400">Owner: {policy.owner_email}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {policy.status === 'draft' && (
                  <Button variant="outline" onClick={() => handlePublish(policy)}
                    className="text-xs px-2 py-1 h-auto">
                    Publish
                  </Button>
                )}
                <button
                  onClick={() => handleAttest(policy.id)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition"
                  title="Attest this policy"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Attest
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePolicyModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => { setPolicies((prev) => [p, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
