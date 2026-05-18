'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listGuardrails, createGuardrail, updateGuardrail, type Guardrail } from '@/lib/api/agents'
import { Shield, Plus, X, ToggleLeft, ToggleRight, Download } from 'lucide-react'

const policyTypeStyle: Record<string, { badge: string; label: string; icon: string }> = {
  block: { badge: 'bg-red-100 text-red-700', label: 'Block', icon: 'bg-red-50' },
  warn:  { badge: 'bg-amber-100 text-amber-700', label: 'Warn', icon: 'bg-amber-50' },
  log:   { badge: 'bg-blue-100 text-blue-700', label: 'Log', icon: 'bg-blue-50' },
}

function getPolicyStyle(policyType: string) {
  return policyTypeStyle[policyType] ?? { badge: 'bg-gray-100 text-gray-500', label: policyType, icon: 'bg-gray-50' }
}

function CreateGuardrailModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (g: Guardrail) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [policyType, setPolicyType] = useState('block')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const g = await createGuardrail({ name, description, policy_type: policyType, enabled: true, conditions: {} })
      toast('Guardrail created.', 'success')
      onCreated(g)
    } catch {
      toast('Failed to create guardrail.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Guardrail</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guardrail name"
              required
            />
          </div>
          <div>
            <label className="label">Policy Type</label>
            <select
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
              className="input-base"
            >
              <option value="block">Block — prevent the action</option>
              <option value="warn">Warn — alert but allow</option>
              <option value="log">Log — record only</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this guardrail protect?"
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
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function exportReport(guardrails: Guardrail[]): void {
  const report = {
    generated_at: new Date().toISOString(),
    total: guardrails.length,
    enabled: guardrails.filter((g) => g.enabled).length,
    disabled: guardrails.filter((g) => !g.enabled).length,
    by_policy_type: Object.fromEntries(
      ['block', 'warn', 'log'].map((t) => [t, guardrails.filter((g) => g.policy_type === t).length])
    ),
    guardrails: guardrails.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      policy_type: g.policy_type,
      enabled: g.enabled,
      created_at: g.created_at,
    })),
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `guardrails-report-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function GuardrailsPage() {
  const { toast } = useToast()
  const [guardrails, setGuardrails] = useState<Guardrail[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    listGuardrails()
      .then(setGuardrails)
      .catch(() => setGuardrails([]))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (g: Guardrail): Promise<void> => {
    try {
      const updated = await updateGuardrail(g.id, { enabled: !g.enabled })
      setGuardrails((prev) => prev.map((item) => item.id === g.id ? updated : item))
      toast(`Guardrail ${updated.enabled ? 'enabled' : 'disabled'}.`, 'success')
    } catch {
      toast('Failed to update guardrail.', 'error')
    }
  }

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Guardrails</h1>
          <p className="page-subtitle">Safety constraints and policy enforcement</p>
        </div>
        <div className="flex items-center gap-2">
          {guardrails.length > 0 && (
            <button
              onClick={() => { exportReport(guardrails); toast('Report downloaded.', 'success') }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <Download className="h-4 w-4" />Export Report
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
          >
            <Plus className="h-4 w-4" />New Guardrail
          </button>
        </div>
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-40" />
                <div className="shimmer h-5 rounded-full w-16 ml-auto" />
                <div className="shimmer h-5 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && guardrails.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No guardrails defined</p>
          <p className="empty-body">Create your first guardrail to protect AI system outputs.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Create Guardrail
          </button>
        </div>
      )}

      {!loading && guardrails.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Policy</th>
                <th>Created</th>
                <th className="text-right">Status</th>
                <th className="text-right">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {guardrails.map((g) => {
                const style = getPolicyStyle(g.policy_type)
                return (
                  <tr key={g.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${style.icon}`}>
                          <Shield className="h-3.5 w-3.5 text-[#1B2A4A]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{g.name}</p>
                          {g.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{g.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.badge}`}>
                        {g.policy_type}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-400">
                        {g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        g.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {g.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleToggle(g)}
                        className="text-gray-400 hover:text-[#1B2A4A] transition"
                        title={g.enabled ? 'Disable' : 'Enable'}
                      >
                        {g.enabled
                          ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                          : <ToggleLeft className="h-5 w-5" />
                        }
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateGuardrailModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { setGuardrails((prev) => [g, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
