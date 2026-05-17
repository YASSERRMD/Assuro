'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { listIncidents, type Incident } from '@/lib/api/incidents'

const statusOrder = ['open', 'investigating', 'mitigated', 'closed'] as const

const severityVariant = (sev: string) => {
  if (sev === 'critical' || sev === 'high') return 'danger'
  if (sev === 'medium') return 'warning'
  return 'default'
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
        <h1 className="text-2xl font-bold text-navy">Incidents</h1>
        <p className="text-sm text-gray-500">{incidents.length} total</p>
      </div>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}

      {!loading && incidents.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No incidents reported. Use the API to file incidents against AI systems.</p>
      )}

      {!loading && incidents.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {statusOrder.map((col) => {
            const colIncidents = incidents.filter((i) => i.status === col)
            return (
              <div key={col} className="rounded-lg bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium capitalize text-navy">{col}</h2>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    {colIncidents.length}
                  </span>
                </div>
                {colIncidents.length === 0 && (
                  <p className="text-xs text-gray-400 italic">None</p>
                )}
                {colIncidents.map((i) => (
                  <div key={i.id} className="mb-2 rounded bg-white p-2 shadow-sm">
                    <p className="text-sm font-medium leading-snug">{i.title}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant={severityVariant(i.severity)} className="capitalize">
                        {i.severity}
                      </Badge>
                    </div>
                    {i.raised_at && (
                      <p className="mt-1 text-xs text-gray-400">
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
