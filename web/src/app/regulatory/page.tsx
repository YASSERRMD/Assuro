'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import {
  listRegulatoryChanges,
  createRegulatoryChange,
  listRegulatoryImpacts,
  type RegulatoryChange,
  type RegulatoryImpact,
} from '@/lib/api/regulatory'
import { Scale, Plus, X, Globe } from 'lucide-react'

type Tab = 'changes' | 'impacts'

const changeKindBadge: Record<string, string> = {
  added: 'bg-emerald-100 text-emerald-700',
  amended: 'bg-amber-100 text-amber-700',
  removed: 'bg-red-100 text-red-700',
  clarified: 'bg-blue-100 text-blue-700',
  upcoming: 'bg-amber-100 text-amber-700',
  active: 'bg-red-100 text-red-700',
  in_force: 'bg-red-100 text-red-700',
  superseded: 'bg-gray-100 text-gray-500',
}

const impactBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
}

const statusBadge: Record<string, string> = {
  resolved: 'bg-emerald-100 text-emerald-700',
  open: 'bg-amber-100 text-amber-700',
  pending: 'bg-blue-100 text-blue-700',
}

function CreateChangeModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (c: RegulatoryChange) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [jurisdiction, setJurisdiction] = useState('EU')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const change = await createRegulatoryChange({ title, source, jurisdiction, description, status: 'upcoming' })
      toast('Regulatory change added.', 'success')
      onCreated(change)
    } catch {
      toast('Failed to add change.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add Regulatory Change</h2>
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
              placeholder="e.g. EU AI Act Article 13"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Source</label>
              <input
                className="input-base"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="EUAIA, NIST..."
              />
            </div>
            <div>
              <label className="label">Jurisdiction</label>
              <input
                className="input-base"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="EU, US, UK..."
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of the regulatory change..."
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
              {submitting ? 'Saving...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegulatoryPage() {
  const [changes, setChanges] = useState<RegulatoryChange[]>([])
  const [impacts, setImpacts] = useState<RegulatoryImpact[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<Tab>('changes')

  useEffect(() => {
    Promise.all([
      listRegulatoryChanges().catch(() => [] as RegulatoryChange[]),
      listRegulatoryImpacts().catch(() => [] as RegulatoryImpact[]),
    ]).then(([c, i]) => { setChanges(c); setImpacts(i) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Regulatory Intelligence</h1>
          <p className="page-subtitle">Track regulatory changes and their impact on AI systems</p>
        </div>
        {tab === 'changes' && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
          >
            <Plus className="h-4 w-4" />Add Change
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-nav mb-4 animate-in">
        {(['changes', 'impacts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-item ${tab === t ? 'active' : ''}`}
          >
            {t === 'changes' ? 'Regulatory Changes' : 'Impact Assessments'}
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
                <div className="shimmer h-4 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes tab */}
      {!loading && tab === 'changes' && (
        <>
          {changes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Scale className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No regulatory changes tracked</p>
              <p className="empty-body">Add regulatory changes that may affect your AI systems.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                <Plus className="h-4 w-4" />Add Change
              </button>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Source / Ref</th>
                    <th>Change Kind</th>
                    <th>Jurisdiction</th>
                    <th>Effective Date</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((change) => (
                    <tr key={change.id}>
                      <td>
                        <p className="font-medium text-gray-900">{change.title}</p>
                        {change.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{change.description}</p>
                        )}
                      </td>
                      <td>
                        {change.source ? (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Globe className="h-3 w-3" />{change.source}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${changeKindBadge[change.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {change.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {change.jurisdiction && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                            {change.jurisdiction}
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-gray-500">
                        {change.effective_date ? new Date(change.effective_date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Impacts tab */}
      {!loading && tab === 'impacts' && (
        <>
          {impacts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Scale className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No impact assessments</p>
              <p className="empty-body">Impact assessments link regulatory changes to specific AI systems.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Change</th>
                    <th>System</th>
                    <th>Impact Level</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {impacts.map((impact) => (
                    <tr key={impact.id}>
                      <td className="font-medium text-gray-900">
                        {impact.description}
                      </td>
                      <td className="text-xs text-gray-500 font-mono">
                        {impact.asset_id ? impact.asset_id.slice(0, 8) + '...' : '-'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${impactBadge[impact.severity] ?? 'bg-gray-100 text-gray-500'}`}>
                          {impact.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[impact.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {impact.status}
                        </span>
                      </td>
                      <td className="text-xs text-gray-400 truncate max-w-xs">
                        {impact.notes ?? '-'}
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
        <CreateChangeModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setChanges((prev) => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
