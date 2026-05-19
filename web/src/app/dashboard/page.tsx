'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { typedFetch } from '@/lib/api'
import { Cpu, AlertTriangle, ClipboardCheck, ShieldAlert } from 'lucide-react'

interface DashboardStats {
  total_ai_systems: number
  by_risk_tier: Record<string, number>
  open_incidents: number
  completed_assessments: number
  framework_coverage: Array<{ framework_key: string; coverage_pct: number }>
}

const tierColors: Record<string, { bar: string; text: string }> = {
  unacceptable: { bar: 'bg-gray-900', text: 'text-gray-900' },
  high: { bar: 'bg-red-500', text: 'text-red-600' },
  limited: { bar: 'bg-orange-400', text: 'text-orange-600' },
  minimal: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  unknown: { bar: 'bg-gray-300', text: 'text-gray-500' },
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

  const totalSystems = stats?.total_ai_systems ?? 0

  const statCards = [
    {
      label: 'AI Systems',
      value: loading ? null : totalSystems,
      icon: Cpu,
      accent: 'bg-[#1B2A4A]/8 text-[#1B2A4A]',
      sub: 'registered',
    },
    {
      label: 'High / Unacceptable Risk',
      value: loading ? null : highRisk,
      icon: ShieldAlert,
      accent: 'bg-orange-50 text-orange-600',
      sub: 'require review',
    },
    {
      label: 'Open Incidents',
      value: loading ? null : (stats?.open_incidents ?? 0),
      icon: AlertTriangle,
      accent: 'bg-red-50 text-red-600',
      sub: 'active now',
    },
    {
      label: 'Completed Assessments',
      value: loading ? null : (stats?.completed_assessments ?? 0),
      icon: ClipboardCheck,
      accent: 'bg-emerald-50 text-emerald-600',
      sub: 'assessments done',
    },
  ]

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">AI governance posture at a glance</p>
        </div>
        <a
          href="/ai-systems/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          + Register AI System
        </a>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.accent}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            {card.value === null ? (
              <div className="shimmer h-8 rounded-lg mb-1" />
            ) : (
              <div className="stat-value">{card.value}</div>
            )}
            <div className="stat-label">{card.label}</div>
            <div className="mt-0.5 text-xs text-gray-400">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Framework Coverage */}
        <div className="card animate-in">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Framework Coverage</h2>
            <span className="text-xs text-gray-400">% of controls addressed</span>
          </div>
          <div className="p-4 space-y-4">
            {loading && (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="shimmer h-4 rounded w-32" />
                    <div className="shimmer h-2.5 rounded-full w-full" />
                  </div>
                ))}
              </>
            )}
            {!loading && (stats?.framework_coverage ?? []).length === 0 && (
              <div className="empty-state py-8">
                <div className="empty-icon">
                  <ClipboardCheck className="h-5 w-5 text-gray-400" />
                </div>
                <p className="empty-title">No coverage data</p>
                <p className="empty-body">Complete an assessment to see framework coverage.</p>
              </div>
            )}
            {(stats?.framework_coverage ?? []).map((c) => (
              <div key={c.framework_key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">{c.framework_key.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-semibold text-gray-900">{c.coverage_pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${c.coverage_pct}%`,
                      background: c.coverage_pct >= 75
                        ? '#10b981'
                        : c.coverage_pct >= 50
                        ? '#3b82f6'
                        : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Tier Breakdown */}
        <div className="card animate-in">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Risk Tier Breakdown</h2>
            <span className="text-xs text-gray-400">systems by tier</span>
          </div>
          <div className="p-4 space-y-3">
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="shimmer h-4 rounded w-20" />
                    <div className="shimmer h-4 rounded-full flex-1" />
                    <div className="shimmer h-4 rounded w-6" />
                  </div>
                ))}
              </>
            )}
            {!loading && stats && (
              (['unacceptable', 'high', 'limited', 'minimal', 'unknown'] as const).map((tier) => {
                const count = stats.by_risk_tier[tier] ?? 0
                const pct = totalSystems > 0 ? Math.round((count / totalSystems) * 100) : 0
                const colors = tierColors[tier]
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-medium text-gray-600 capitalize text-right">{tier}</span>
                    <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-6 text-xs font-bold text-right tabular-nums ${colors.text}`}>{count}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
