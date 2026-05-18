'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { listIncidents, type Incident } from '@/lib/api/incidents'
import { AlertTriangle } from 'lucide-react'

const statusOrder = ['open', 'investigating', 'mitigated', 'closed'] as const

const statusColors: Record<string, string> = {
  open: 'border-t-red-400 bg-red-50/40',
  investigating: 'border-t-orange-400 bg-orange-50/40',
  mitigated: 'border-t-blue-400 bg-blue-50/40',
  closed: 'border-t-gray-300 bg-gray-50/40',
}

const statusHeaderColors: Record<string, string> = {
  open: 'text-red-700',
  investigating: 'text-orange-700',
  mitigated: 'text-blue-700',
  closed: 'text-gray-600',
}

const severityVariant = (sev: string) => {
  if (sev === 'critical' || sev === 'high') return 'danger'
  if (sev === 'medium') return 'warning'
  return 'default'
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
        <AlertTriangle className="h-8 w-8 text-amber-300" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">No incidents reported</p>
        <p className="mt-1 text-sm text-gray-400">
          Incidents are filed against AI systems when issues arise. All clear for now.
        </p>
      </div>
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-4 gap-4">
      {statusOrder.map((col) => (
        <div key={col} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <Skeleton className="mb-3 h-4 w-24" />
          {[1, 2].map((i) => (
            <div key={i} className="mb-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-3 w-16 rounded-full" />
              <Skeleton className="mt-2 h-3 w-12" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listIncidents().then(setIncidents).catch(() => null).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track and triage AI system incidents</p>
        </div>
        {!loading && incidents.length > 0 && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {incidents.length} total
          </span>
        )}
      </div>

      {loading && <KanbanSkeleton />}

      {!loading && incidents.length === 0 && <EmptyState />}

      {!loading && incidents.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {statusOrder.map((col) => {
            const colIncidents = incidents.filter((i) => i.status === col)
            return (
              <div
                key={col}
                className={`rounded-xl border-t-4 bg-white p-3 shadow-sm ring-1 ring-gray-100 ${statusColors[col]}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className={`text-xs font-semibold uppercase tracking-wider ${statusHeaderColors[col]}`}>
                    {col}
                  </h2>
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
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge variant={severityVariant(i.severity)} className="capitalize">
                        {i.severity}
                      </Badge>
                    </div>
                    {i.raised_at && (
                      <p className="mt-1.5 text-xs text-gray-400">
                        {new Date(i.raised_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
