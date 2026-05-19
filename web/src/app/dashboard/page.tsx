'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/shell/Shell'
import { typedFetch } from '@/lib/api'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { listIncidents, type Incident } from '@/lib/api/incidents'
import { listAssessments, type Assessment } from '@/lib/api/assessments'
import {
  AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle2,
  Clock, ChevronRight, ExternalLink, Bell, FileCheck,
  Activity, Circle, ArrowRight, Cpu, BookOpen,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
interface Stats {
  total_ai_systems: number
  by_risk_tier: Record<string, number>
  open_incidents: number
  completed_assessments: number
  framework_coverage: Array<{ framework_key: string; coverage_pct: number }>
}

interface Notification {
  id: string
  category: string
  title: string
  body: string
  severity: string
  link_url: string
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────
const riskColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  high:         { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200', dot: 'bg-red-500' },
  limited:      { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400' },
  minimal:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  unacceptable: { bg: 'bg-gray-100',   text: 'text-gray-800',    border: 'border-gray-300', dot: 'bg-gray-700' },
  unknown:      { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-100', dot: 'bg-gray-300' },
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-gray-100 text-gray-500',
}

const incidentStatusColors: Record<string, string> = {
  open:          'text-red-600',
  investigating: 'text-orange-600',
  mitigated:     'text-blue-600',
  closed:        'text-gray-400',
}

const fwLabels: Record<string, string> = {
  eu_ai_act:    'EU AI Act',
  nist_ai_rmf:  'NIST AI RMF',
  iso_42001:    'ISO 42001',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

// ── Compliance bar ────────────────────────────────────────────────
function ComplianceBar({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
  const status = pct >= 70 ? 'On track' : pct >= 40 ? 'In progress' : 'Critical gap'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{status}</span>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats]             = useState<Stats | null>(null)
  const [systems, setSystems]         = useState<AISystem[]>([])
  const [incidents, setIncidents]     = useState<Incident[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      typedFetch<Stats>('/v1/stats'),
      listAISystems(),
      listIncidents().catch(() => [] as Incident[]),
      listAssessments().catch(() => [] as Assessment[]),
      typedFetch<Notification[]>('/v1/notifications').catch(() => [] as Notification[]),
    ]).then(([s, sys, inc, asm, notif]) => {
      setStats(s)
      setSystems(sys)
      setIncidents(inc)
      setAssessments(asm)
      setNotifications(notif)
    }).finally(() => setLoading(false))
  }, [])

  // Derived state
  const assessedIds = new Set(assessments.map(a => a.asset_id))
  const highRiskSystems = systems.filter(s => s.latest_risk_tier === 'high' || s.latest_risk_tier === 'unacceptable')
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating')
  const systemMap = Object.fromEntries(systems.map(s => [s.id, s.name]))
  const criticalNotif = notifications.find(n => n.severity === 'critical')
  const avgCoverage = stats?.framework_coverage?.length
    ? Math.round(stats.framework_coverage.reduce((s, f) => s + f.coverage_pct, 0) / stats.framework_coverage.length)
    : 0

  return (
    <Shell>

      {/* ── Critical alert banner ───────────────────────────────── */}
      {!loading && criticalNotif && (
        <Link
          href={criticalNotif.link_url || '/regulatory'}
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 transition hover:bg-red-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">{criticalNotif.title}</p>
            <p className="mt-0.5 text-xs text-red-600 line-clamp-1">{criticalNotif.body}</p>
          </div>
          <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
        </Link>
      )}

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'AI Systems',          value: stats?.total_ai_systems ?? 0, icon: Cpu,           href: '/ai-systems',  note: `${highRiskSystems.length} high risk`,      iconCls: 'text-[#1B2A4A]', bg: 'bg-[#1B2A4A]/8' },
          { label: 'Open Incidents',       value: openIncidents.length,          icon: AlertTriangle,  href: '/incidents',   note: `${incidents.filter(i=>i.severity==='critical').length} critical`,  iconCls: 'text-red-600',   bg: 'bg-red-50' },
          { label: 'Avg Compliance',       value: `${avgCoverage}%`,             icon: ShieldCheck,    href: '/frameworks',  note: 'across 3 frameworks',                     iconCls: avgCoverage >= 50 ? 'text-emerald-600' : 'text-orange-600', bg: avgCoverage >= 50 ? 'bg-emerald-50' : 'bg-orange-50' },
          { label: 'Assessments Done',     value: stats?.completed_assessments ?? 0, icon: FileCheck, href: '/assessments', note: `${systems.length - assessedIds.size} systems unassessed`, iconCls: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((c) => (
          <Link key={c.label} href={c.href} className="card group flex items-center gap-4 p-5 transition hover:shadow-md">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.iconCls}`} />
            </div>
            <div className="min-w-0">
              {loading
                ? <div className="shimmer h-6 rounded w-10 mb-1" />
                : <p className="text-2xl font-bold tracking-tight text-gray-900">{c.value}</p>}
              <p className="text-xs font-semibold text-gray-600">{c.label}</p>
              <p className="text-[11px] text-gray-400">{c.note}</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-200 transition group-hover:text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left col — 2/3 width */}
        <div className="space-y-5 lg:col-span-2">

          {/* Systems requiring action */}
          <div className="card">
            <div className="card-header">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-800">Systems Requiring Immediate Action</h2>
              <Link href="/ai-systems" className="ml-auto flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading && [1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="shimmer h-4 rounded w-40" />
                  <div className="shimmer h-5 rounded-full w-14 ml-auto" />
                  <div className="shimmer h-5 rounded-full w-20" />
                </div>
              ))}
              {!loading && highRiskSystems.length === 0 && (
                <div className="px-5 py-6 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                  <p className="text-sm text-gray-500">No high-risk systems — good standing.</p>
                </div>
              )}
              {!loading && highRiskSystems.map(sys => {
                const rc = riskColors[sys.latest_risk_tier] ?? riskColors.unknown
                const hasAssessment = assessedIds.has(sys.id)
                const sysIncidents = incidents.filter(i => i.asset_id === sys.id)
                return (
                  <Link key={sys.id} href={`/ai-systems/${sys.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-gray-50/60 group">
                    <div className={`h-2 w-2 flex-shrink-0 rounded-full ${rc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B2A4A]">{sys.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{sys.intended_purpose || sys.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize border ${rc.bg} ${rc.text} ${rc.border}`}>
                        {sys.latest_risk_tier} risk
                      </span>
                      {!hasAssessment && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                          No assessment
                        </span>
                      )}
                      {sysIncidents.length > 0 && (
                        <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                          {sysIncidents.length} incident{sysIncidents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Framework compliance */}
          <div className="card">
            <div className="card-header">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Regulatory Compliance Coverage</h2>
              <Link href="/frameworks" className="ml-auto flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline">
                Full breakdown <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5 space-y-4">
              {loading && [1, 2, 3].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="shimmer h-4 rounded w-32" />
                  <div className="shimmer h-2 rounded-full w-full" />
                </div>
              ))}
              {!loading && (stats?.framework_coverage ?? []).map(fw => (
                <ComplianceBar
                  key={fw.framework_key}
                  label={fwLabels[fw.framework_key] ?? fw.framework_key}
                  pct={fw.coverage_pct}
                />
              ))}
              {!loading && (stats?.framework_coverage ?? []).length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No framework data yet. Complete an assessment to populate.</p>
              )}
            </div>
            {!loading && (stats?.framework_coverage ?? []).length > 0 && (
              <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  Coverage gaps identified across all frameworks.
                  <Link href="/assessments" className="ml-1 font-medium text-[#1B2A4A] hover:underline">
                    Start an assessment
                  </Link> to close them.
                </p>
              </div>
            )}
          </div>

          {/* Active incidents */}
          <div className="card">
            <div className="card-header">
              <Activity className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Active Incidents</h2>
              <Link href="/incidents" className="ml-auto flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline">
                All incidents <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading && [1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="shimmer h-4 rounded w-48" />
                  <div className="shimmer h-5 rounded-full w-16 ml-auto" />
                </div>
              ))}
              {!loading && openIncidents.length === 0 && (
                <div className="px-5 py-5 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                  <p className="text-sm text-gray-500">No active incidents.</p>
                </div>
              )}
              {!loading && openIncidents.map(inc => (
                <Link key={inc.id} href="/incidents" className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-gray-50/60 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B2A4A]">{inc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {systemMap[inc.asset_id] ? `${systemMap[inc.asset_id]} · ` : ''}{timeAgo(inc.raised_at ?? '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityColors[inc.severity] ?? 'bg-gray-100 text-gray-500'}`}>
                      {inc.severity}
                    </span>
                    <span className={`text-xs font-medium capitalize ${incidentStatusColors[inc.status] ?? 'text-gray-500'}`}>
                      {inc.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right col — 1/3 width */}
        <div className="space-y-5">

          {/* Risk distribution */}
          <div className="card">
            <div className="card-header">
              <ShieldAlert className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Risk Distribution</h2>
            </div>
            <div className="p-5">
              {loading && [1,2,3,4].map(i => (
                <div key={i} className="mb-3 flex items-center gap-2">
                  <div className="shimmer h-3 rounded w-16" />
                  <div className="shimmer h-2 flex-1 rounded-full" />
                  <div className="shimmer h-3 rounded w-4" />
                </div>
              ))}
              {!loading && (
                <div className="space-y-3">
                  {(['unacceptable','high','limited','minimal','unknown'] as const).map(tier => {
                    const count = stats?.by_risk_tier?.[tier] ?? 0
                    const pct = (stats?.total_ai_systems ?? 0) > 0 ? (count / (stats?.total_ai_systems ?? 1)) * 100 : 0
                    const rc = riskColors[tier]
                    return (
                      <div key={tier} className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${rc.dot}`} />
                        <span className="w-24 text-xs capitalize text-gray-700">{tier}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${rc.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-4 text-right text-xs font-bold text-gray-700 tabular-nums">{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Alerts & notifications */}
          <div className="card">
            <div className="card-header">
              <Bell className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Alerts & Notifications</h2>
              <Link href="/notifications" className="ml-auto flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline">
                All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading && [1,2,3].map(i => (
                <div key={i} className="px-4 py-3 space-y-1">
                  <div className="shimmer h-3 rounded w-40" />
                  <div className="shimmer h-3 rounded w-full" />
                </div>
              ))}
              {!loading && notifications.slice(0, 4).map(n => {
                const dot = n.severity === 'critical' ? 'bg-red-500'
                  : n.severity === 'warning' ? 'bg-amber-400'
                  : 'bg-blue-400'
                return (
                  <Link key={n.id} href={n.link_url || '/notifications'} className="flex gap-3 px-4 py-3 transition hover:bg-gray-50 group">
                    <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-[#1B2A4A] leading-tight">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500 leading-tight line-clamp-2">{n.body}</p>
                    </div>
                  </Link>
                )
              })}
              {!loading && notifications.length === 0 && (
                <p className="px-4 py-4 text-xs text-gray-400 text-center">No notifications.</p>
              )}
            </div>
          </div>

          {/* Recent assessments */}
          <div className="card">
            <div className="card-header">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Recent Assessments</h2>
              <Link href="/assessments" className="ml-auto flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline">
                All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading && [1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="shimmer h-3 rounded w-32" />
                  <div className="shimmer h-4 rounded-full w-16 ml-auto" />
                </div>
              ))}
              {!loading && assessments.slice(0, 5).map(a => {
                const statusColor = a.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700'
                  : a.status === 'in_progress'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
                return (
                  <Link key={a.id} href={`/assessments/${a.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-[#1B2A4A] truncate">
                        {systemMap[a.asset_id] ?? 'Unknown system'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <p className="text-[11px] text-gray-400">{fmtDate(a.created_at)}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor}`}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </Link>
                )
              })}
              {!loading && assessments.length === 0 && (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs text-gray-400">No assessments yet.</p>
                  <Link href="/ai-systems" className="mt-1 inline-block text-xs font-medium text-[#1B2A4A] hover:underline">
                    Start from an AI system →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Unassessed systems */}
          {!loading && systems.filter(s => !assessedIds.has(s.id)).length > 0 && (
            <div className="card border-amber-100">
              <div className="card-header">
                <Circle className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-gray-800">Systems Without Assessment</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {systems.filter(s => !assessedIds.has(s.id)).slice(0, 4).map(sys => {
                  const rc = riskColors[sys.latest_risk_tier] ?? riskColors.unknown
                  return (
                    <Link key={sys.id} href={`/ai-systems/${sys.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-amber-50/40 group">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${rc.dot}`} />
                      <span className="flex-1 text-xs font-medium text-gray-700 group-hover:text-[#1B2A4A] truncate">{sys.name}</span>
                      <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-gray-500" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </Shell>
  )
}
