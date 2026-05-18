'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Gauge } from '@/components/charts/Gauge'
import { StatCard } from '@/components/ui/StatCard'
import { SkeletonStatCard } from '@/components/ui/Skeleton'
import { typedFetch } from '@/lib/api'
import { Cpu, AlertTriangle, ClipboardCheck, ShieldAlert } from 'lucide-react'

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

  const highRisk = stats
    ? (stats.by_risk_tier['high'] ?? 0) + (stats.by_risk_tier['unacceptable'] ?? 0)
    : 0

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">AI governance posture at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              label="AI Systems"
              value={stats?.total_ai_systems ?? 0}
              icon={Cpu}
              accent="navy"
              subtext="registered systems"
            />
            <StatCard
              label="High / Unacceptable Risk"
              value={highRisk}
              icon={ShieldAlert}
              accent="orange"
              subtext="require immediate review"
            />
            <StatCard
              label="Open Incidents"
              value={stats?.open_incidents ?? 0}
              icon={AlertTriangle}
              accent="red"
              subtext="active incidents"
            />
            <StatCard
              label="Completed Assessments"
              value={stats?.completed_assessments ?? 0}
              icon={ClipboardCheck}
              accent="green"
              subtext="assessments done"
            />
          </>
        )}
      </div>

      {/* Framework coverage */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">Framework Coverage</h2>
        <p className="mt-0.5 text-sm text-gray-500">Percentage of controls addressed per framework</p>
        <div className="mt-4 flex flex-wrap gap-6">
          {loading && (
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          )}
          {!loading && (stats?.framework_coverage ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-10 py-8 text-center">
              <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">No framework coverage data yet. Complete an assessment to see coverage.</p>
            </div>
          )}
          {(stats?.framework_coverage ?? []).map((c) => (
            <Gauge key={c.framework_key} label={c.framework_key} pct={c.coverage_pct} />
          ))}
        </div>
      </div>

      {/* Risk breakdown */}
      {!loading && stats && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-gray-900">Risk Tier Breakdown</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {(['unacceptable', 'high', 'limited', 'minimal', 'unknown'] as const).map((tier) => {
              const count = stats.by_risk_tier[tier] ?? 0
              const tierStyles: Record<string, string> = {
                unacceptable: 'bg-black text-white',
                high: 'bg-red-100 text-red-800',
                limited: 'bg-orange-100 text-orange-800',
                minimal: 'bg-emerald-100 text-emerald-800',
                unknown: 'bg-gray-100 text-gray-600',
              }
              return (
                <div key={tier} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${tierStyles[tier]}`}>
                  <span className="capitalize">{tier}</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-bold">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Shell>
  )
}
