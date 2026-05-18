'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { getAnalyticsDashboard, getRiskTrend, type AnalyticsDashboard, type RiskTrendPoint } from '@/lib/api/analytics'
import { TrendingUp, Cpu, Bot, AlertTriangle, GitPullRequest, ShieldCheck } from 'lucide-react'

function StatBox({ label, value, icon: Icon, color }: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </Card>
  )
}

function RiskBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-gray-600 capitalize text-right">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-xs font-semibold text-gray-700 text-right">{value}</span>
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

  const tierColors: Record<string, string> = {
    unacceptable: 'bg-black',
    high: 'bg-red-500',
    limited: 'bg-orange-400',
    minimal: 'bg-emerald-500',
    unknown: 'bg-gray-300',
  }

  const incidentsBySev = dashboard?.incidents_by_severity ?? {}
  const maxIncidentCount = Math.max(...Object.values(incidentsBySev), 1)

  const severityColors: Record<string, string> = {
    critical: 'bg-red-600',
    high: 'bg-red-400',
    medium: 'bg-orange-400',
    low: 'bg-yellow-400',
  }

  // Simple bar chart for risk trend
  const trendMax = Math.max(...trend.map((p) => p.high + p.medium + p.low), 1)

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">AI governance metrics and risk trends</p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-28" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && dashboard && (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatBox label="Total AI Systems" value={dashboard.total_ai_systems} icon={Cpu} color="bg-[#0f1f3d]/5 text-[#0f1f3d]" />
            <StatBox label="Total Agents" value={dashboard.total_agents} icon={Bot} color="bg-blue-50 text-blue-600" />
            <StatBox label="Open Incidents" value={dashboard.open_incidents} icon={AlertTriangle} color="bg-red-50 text-red-600" />
            <StatBox label="Pending Approvals" value={dashboard.pending_approvals} icon={GitPullRequest} color="bg-violet-50 text-violet-600" />
            <StatBox
              label="Compliance Score"
              value={`${dashboard.compliance_score ?? 0}%`}
              icon={ShieldCheck}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatBox label="Risk Trend" value="View Below" icon={TrendingUp} color="bg-amber-50 text-amber-600" />
          </div>

          {/* Risk by tier */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Risk by Tier</h2>
              <div className="space-y-3">
                {(['unacceptable', 'high', 'limited', 'minimal', 'unknown'] as const).map((tier) => (
                  <RiskBar
                    key={tier}
                    label={tier}
                    value={riskByTier[tier] ?? 0}
                    max={maxRiskCount}
                    color={tierColors[tier] ?? 'bg-gray-400'}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Incidents by Severity</h2>
              <div className="space-y-3">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <RiskBar
                    key={sev}
                    label={sev}
                    value={incidentsBySev[sev] ?? 0}
                    max={maxIncidentCount}
                    color={severityColors[sev] ?? 'bg-gray-400'}
                  />
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Risk trend */}
      {!loading && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Risk Trend Over Time</h2>
          {trend.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <TrendingUp className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">No trend data available yet.</p>
            </div>
          ) : (
            <div className="flex items-end gap-2 h-40 overflow-x-auto">
              {trend.map((point) => {
                const total = point.high + point.medium + point.low
                const heightPct = trendMax > 0 ? (total / trendMax) * 100 : 0
                return (
                  <div key={point.date} className="flex flex-col items-center gap-1 min-w-[48px]">
                    <div className="w-8 flex flex-col-reverse rounded-sm overflow-hidden" style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: '4px' }}>
                      <div className="bg-emerald-400" style={{ height: `${total > 0 ? (point.low / total) * 100 : 0}%` }} />
                      <div className="bg-orange-400" style={{ height: `${total > 0 ? (point.medium / total) * 100 : 0}%` }} />
                      <div className="bg-red-500" style={{ height: `${total > 0 ? (point.high / total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 rotate-45 origin-left whitespace-nowrap">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {trend.length > 0 && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" />High</div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400 inline-block" />Medium</div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block" />Low</div>
            </div>
          )}
        </Card>
      )}
    </Shell>
  )
}
