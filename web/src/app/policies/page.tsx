'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listPolicies, createPolicy, updatePolicyStatus, attestPolicy, type Policy } from '@/lib/api/policies'
import { FileCheck, Plus, X, ShieldCheck } from 'lucide-react'

const statusConfig: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'bg-gray-100 text-gray-600', label: 'Draft' },
  active: { badge: 'bg-emerald-100 text-emerald-700', label: 'Active' },
  approved: { badge: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  under_review: { badge: 'bg-blue-100 text-blue-700', label: 'Under Review' },
  in_review: { badge: 'bg-blue-100 text-blue-700', label: 'In Review' },
  archived: { badge: 'bg-gray-100 text-gray-400', label: 'Archived' },
}

function fmtLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getStatus(status: string) {
  return statusConfig[status] ?? { badge: 'bg-gray-100 text-gray-500', label: fmtLabel(status) }
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Policy</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Policy title"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Policy summary..."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Policy content..."
              rows={5}
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
              {submitting ? 'Creating...' : 'Create Policy'}
            </button>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Policies</h1>
          <p className="page-subtitle">Manage AI governance policies and attestations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />New Policy
        </button>
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-5 rounded-full w-16 ml-auto" />
                <div className="shimmer h-5 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && policies.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <FileCheck className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No policies yet</p>
          <p className="empty-body">Create governance policies for your AI systems.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Create Policy
          </button>
        </div>
      )}

      {!loading && policies.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Version</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Last Updated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => {
                const sc = getStatus(policy.status)
                return (
                  <tr key={policy.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{policy.title}</p>
                          {policy.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{policy.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                        Governance
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-500">v{policy.version}</td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{policy.owner_email ?? '-'}</td>
                    <td className="text-xs text-gray-400">
                      {new Date(policy.updated_at ?? policy.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {policy.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(policy)}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleAttest(policy.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <ShieldCheck className="h-3 w-3" />Attest
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
