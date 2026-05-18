'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listIncidents, createIncident, type Incident } from '@/lib/api/incidents'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { AlertTriangle, Plus, X } from 'lucide-react'

const severityConfig: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
}

const statusConfig: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-orange-100 text-orange-700',
  mitigated: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-500',
}

function CreateIncidentModal({ systems, onClose, onCreated }: {
  systems: AISystem[]
  onClose: () => void
  onCreated: (i: Incident) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [assetId, setAssetId] = useState(systems[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const inc = await createIncident({ asset_id: assetId, title, description, severity })
      toast('Incident created.', 'success')
      onCreated(inc)
    } catch {
      toast('Failed to create incident.', 'error')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Report Incident</h2>
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
              placeholder="Brief description of the incident"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, observed behaviour, impact..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="input-base"
              >
                {['low', 'medium', 'high', 'critical'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">AI System</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="input-base"
              >
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
              {submitting ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [systems, setSystems] = useState<AISystem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      listIncidents().catch(() => [] as Incident[]),
      listAISystems().catch(() => [] as AISystem[]),
    ]).then(([incs, sys]) => { setIncidents(incs); setSystems(sys) }).finally(() => setLoading(false))
  }, [])

  const filtered = severityFilter === 'all'
    ? incidents
    : incidents.filter((i) => i.severity === severityFilter)

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">Track and triage AI system incidents</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />Report Incident
        </button>
      </div>

      {/* Severity filter tabs */}
      <div className="tab-nav mb-4 animate-in">
        {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`tab-item ${severityFilter === s ? 'active' : ''}`}
          >
            <span className="capitalize">{s === 'all' ? 'All Severities' : s}</span>
            {s !== 'all' && (
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${severityConfig[s]}`}>
                {incidents.filter((i) => i.severity === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-5 rounded-full w-16" />
                <div className="shimmer h-5 rounded-full w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <AlertTriangle className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">
            {incidents.length === 0 ? 'No incidents reported' : 'No incidents match filter'}
          </p>
          <p className="empty-body">
            {incidents.length === 0
              ? 'All AI systems are operating normally.'
              : 'Try a different severity filter.'}
          </p>
          {incidents.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <Plus className="h-4 w-4" />Report Incident
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Affected System</th>
                <th>Reporter</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr key={inc.id}>
                  <td>
                    <p className="font-medium text-gray-900">{inc.title}</p>
                    {inc.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5 line-clamp-1">{inc.description}</p>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityConfig[inc.severity] ?? 'bg-gray-100 text-gray-500'}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusConfig[inc.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500 font-mono">
                    {inc.asset_id ? inc.asset_id.slice(0, 8) + '...' : '-'}
                  </td>
                  <td className="text-xs text-gray-500">{inc.reporter_email ?? '-'}</td>
                  <td className="text-xs text-gray-400">
                    {inc.raised_at ? new Date(inc.raised_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && systems.length > 0 && (
        <CreateIncidentModal
          systems={systems}
          onClose={() => setShowCreate(false)}
          onCreated={(inc) => { setIncidents((prev) => [inc, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
