'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listIncidents, createIncident, type Incident } from '@/lib/api/incidents'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { AlertTriangle, Plus, X } from 'lucide-react'

const statusOrder = ['open', 'investigating', 'mitigated', 'closed'] as const

const statusConfig: Record<string, { border: string; header: string; bg: string }> = {
  open: { border: 'border-t-red-400', header: 'text-red-700', bg: 'bg-red-50/30' },
  investigating: { border: 'border-t-orange-400', header: 'text-orange-700', bg: 'bg-orange-50/30' },
  mitigated: { border: 'border-t-blue-400', header: 'text-blue-700', bg: 'bg-blue-50/30' },
  closed: { border: 'border-t-gray-300', header: 'text-gray-500', bg: 'bg-gray-50/30' },
}

const severityVariant = (sev: string) => {
  if (sev === 'critical' || sev === 'high') return 'danger'
  if (sev === 'medium') return 'warning'
  return 'default'
}

function KanbanSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-4 gap-4">
      {statusOrder.map((col) => (
        <div key={col} className="rounded-xl border-t-4 border-gray-200 bg-white p-3 shadow-card">
          <Skeleton className="mb-3 h-4 w-24" />
          {[1, 2].map((i) => (
            <div key={i} className="mb-2 rounded-lg bg-gray-50 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-3 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Report Incident</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the incident" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, observed behaviour, impact…" rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
                {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">AI System</label>
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
                {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Create Incident'}</Button>
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

  useEffect(() => {
    Promise.all([
      listIncidents().catch(() => [] as Incident[]),
      listAISystems().catch(() => [] as AISystem[]),
    ]).then(([incs, sys]) => { setIncidents(incs); setSystems(sys) }).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track and triage AI system incidents</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {loading && <KanbanSkeleton />}

      {!loading && incidents.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="h-8 w-8 text-amber-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No incidents reported</p>
            <p className="mt-1 text-sm text-gray-400">All AI systems are operating normally.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Report Incident
          </Button>
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {statusOrder.map((col) => {
            const cfg = statusConfig[col]
            const colIncidents = incidents.filter((i) => i.status === col)
            return (
              <div key={col} className={`rounded-xl border-t-4 bg-white p-3 shadow-card ring-1 ring-gray-100 ${cfg.border} ${cfg.bg}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className={`text-xs font-semibold uppercase tracking-wider ${cfg.header}`}>{col}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
                    {colIncidents.length}
                  </span>
                </div>
                {colIncidents.length === 0 && (
                  <p className="py-4 text-center text-xs italic text-gray-300">No incidents</p>
                )}
                {colIncidents.map((i) => (
                  <div key={i.id} className="mb-2 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                    <p className="text-sm font-medium leading-snug text-gray-800">{i.title}</p>
                    {i.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">{i.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge variant={severityVariant(i.severity)} className="capitalize">{i.severity}</Badge>
                    </div>
                    {i.raised_at && (
                      <p className="mt-1.5 text-xs text-gray-400">{new Date(i.raised_at).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
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
