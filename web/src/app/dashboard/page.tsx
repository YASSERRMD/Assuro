'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Gauge } from '@/components/charts/Gauge'
import { typedFetch } from '@/lib/api'

interface DashboardStats {
  total_ai_systems: number
  by_risk_tier: Record<string, number>
  open_incidents: number
  completed_assessments: number
  framework_coverage: Array<{ framework_key: string; coverage_pct: number }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    typedFetch<DashboardStats>('/v1/stats')
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const highRisk = stats ? ((stats.by_risk_tier['high'] ?? 0) + (stats.by_risk_tier['unacceptable'] ?? 0)) : 0

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">AI Systems</p>
          <p className="text-3xl font-bold text-navy">{loading ? '—' : (stats?.total_ai_systems ?? 0)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">High / Unacceptable Risk</p>
          <p className="text-3xl font-bold text-orange-500">{loading ? '—' : highRisk}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Open Incidents</p>
          <p className="text-3xl font-bold text-red-600">{loading ? '—' : (stats?.open_incidents ?? 0)}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Completed Assessments</p>
          <p className="text-3xl font-bold text-green-600">{loading ? '—' : (stats?.completed_assessments ?? 0)}</p>
        </div>
      </div>
      <h2 className="mt-6 text-lg font-medium">Framework Coverage</h2>
      <div className="mt-4 flex flex-wrap gap-6">
        {loading && <p className="text-sm text-gray-400">Loading...</p>}
        {!loading && (stats?.framework_coverage ?? []).length === 0 && (
          <p className="text-sm text-gray-400">No framework coverage data yet.</p>
        )}
        {(stats?.framework_coverage ?? []).map((c) => (
          <Gauge key={c.framework_key} label={c.framework_key} pct={c.coverage_pct} />
        ))}
      </div>
    </Shell>
  )
}
