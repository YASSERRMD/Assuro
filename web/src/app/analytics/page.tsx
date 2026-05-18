'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { getAnalyticsDashboard, getRiskTrend, type AnalyticsDashboard, type RiskTrendPoint } from '@/lib/api/analytics'
import { TrendingUp, Cpu, AlertTriangle, GitPullRequest, ShieldCheck, Bot } from 'lucide-react'

const tierColors: Record<string, string> = {
  unacceptable: 'bg-gray-900',
  high: 'bg-red-500',
  limited: 'bg-orange-400',
  minimal: 'bg-emerald-500',
  unknown: 'bg-gray-300',
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-red-400',
  medium: 'bg-orange-400',
  low: 'bg-yellow-400',
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-gray-600 capitalize text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-xs font-bold text-gray-700 text-right tabular-nums">{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null)
  const [trend, setTrend] = useState<RiskTrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAnalyticsDashboard().catch(() => null),
      getRiskTrend().catch(() => [] as RiskTrendPoint[]),
    ]).then(([dash, trendData]) => {
      setDashboard(dash)
      setTrend(trendData)
    }).finally(() => setLoading(false))
  }, [])

  const riskByTier = dashboard?.risk_by_tier ?? {}
  const maxRiskCount = Math.max(...Object.values(riskByTier), 1)
  const incidentsBySev = dashboard?.incidents_by_severity ?? {}
  const maxIncidentCount = Math.max(...Object.values(incidentsBySev), 1)

  // SVG trend line
  const trendPoints = trend.slice(-20)
  const trendMax = Math.max(...trendPoints.map((p) => p.score ?? (p.high + p.medium + p.low)), 1)

  const statCards = loading ? [] : [
    { label: 'Total AI Systems', value: dashboard?.total_ai_systems ?? 0, icon: Cpu, color: 'bg-[#1B2A4A]/6 text-[#1B2A4A]' },
    { label: 'Total Agents', value: dashboard?.total_agents ?? 0, icon: Bot, color: 'bg-blue-50 text-blue-600' },
    { label: 'Open Incidents', value: dashboard?.open_incidents ?? 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: 'Pending Approvals', value: dashboard?.pending_approvals ?? 0, icon: GitPullRequest, color: 'bg-violet-50 text-violet-600' },
    { label: 'Compliance Score', value: `${dashboard?.compliance_score ?? 0}%`, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Risk Trends', value: trend.length > 0 ? `${trendPoints.length} pts` : 'No data', icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">AI governance metrics and risk trends</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 animate-in">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="stat-card">
              <div className="shimmer h-8 w-8 rounded-lg mb-2" />
              <div className="shimmer h-7 rounded w-16 mb-1" />
              <div className="shimmer h-4 rounded w-24" />
            </div>
          ))
          : statCards.map((card) => (
            <div key={card.label} className="stat-card">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))
        }
      </div>

      {!loading && dashboard && (
        <div className="grid gap-5 sm:grid-cols-2 mb-5 animate-in">
          {/* Risk by Tier */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Risk Distribution by Tier</h2>
            </div>
            <div className="p-4 space-y-3">
              {(['unacceptable', 'high', 'limited', 'minimal', 'unknown'] as const).map((tier) => (
                <HBar
                  key={tier}
                  label={tier}
                  value={riskByTier[tier] ?? 0}
                  max={maxRiskCount}
                  color={tierColors[tier] ?? 'bg-gray-400'}
                />
              ))}
            </div>
          </div>

          {/* Incidents by Severity */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-700">Incidents by Severity</h2>
            </div>
            <div className="p-4 space-y-3">
              {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                <HBar
                  key={sev}
                  label={sev}
                  value={incidentsBySev[sev] ?? 0}
                  max={maxIncidentCount}
                  color={severityColors[sev] ?? 'bg-gray-400'}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk trend */}
      {!loading && (
        <div className="card animate-in">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-700">Risk Trend Over Time</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" />High</div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400 inline-block" />Medium</div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block" />Low</div>
            </div>
          </div>
          <div className="p-4">
            {trendPoints.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-icon">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <p className="empty-title">No trend data</p>
                <p className="empty-body">Risk trend data will appear here as assessments are completed.</p>
              </div>
            ) : (
              <>
                {/* SVG polyline trend */}
                <svg
                  width="100%"
                  height="120"
                  viewBox={`0 0 ${trendPoints.length * 30} 100`}
                  preserveAspectRatio="none"
                  className="w-full"
                >
                  <polyline
                    points={trendPoints.map((p, i) => {
                      const val = p.score ?? (p.high + p.medium + p.low)
                      const x = i * 30 + 15
                      const y = 100 - (val / trendMax) * 90
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#1B2A4A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* High risk area */}
                  <polyline
                    points={trendPoints.map((p, i) => {
                      const x = i * 30 + 15
                      const y = 100 - (p.high / trendMax) * 90
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity="0.7"
                  />
                </svg>
                <div className="flex items-center justify-between mt-2 overflow-x-auto">
                  {trendPoints.filter((_, i) => i % 4 === 0).map((point) => (
                    <span key={point.date} className="text-[9px] text-gray-400 whitespace-nowrap">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}
