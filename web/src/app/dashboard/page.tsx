'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shell } from '@/components/shell/Shell'
import { typedFetch } from '@/lib/api'
import {
  Cpu, AlertTriangle, ClipboardCheck, ShieldAlert,
  TrendingUp, ArrowUpRight, Activity, ChevronRight,
  ShieldCheck, BookOpen, FileCheck,
} from 'lucide-react'

interface DashboardStats {
  total_ai_systems: number
  by_risk_tier: Record<string, number>
  open_incidents: number
  completed_assessments: number
  framework_coverage: Array<{ framework_key: string; coverage_pct: number }>
}

const fwLabel: Record<string, string> = {
  eu_ai_act: 'EU AI Act',
  nist_ai_rmf: 'NIST AI RMF',
  iso_42001: 'ISO 42001',
}

const tierColor: Record<string, { dot: string; text: string }> = {
  unacceptable: { dot: 'bg-gray-700',    text: 'text-gray-700' },
  high:         { dot: 'bg-red-500',     text: 'text-red-600' },
  limited:      { dot: 'bg-orange-400',  text: 'text-orange-600' },
  minimal:      { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  unknown:      { dot: 'bg-gray-300',    text: 'text-gray-400' },
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - score / 100)
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="#ffffff">{score}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)">out of 100</text>
    </svg>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    typedFetch<DashboardStats>('/v1/stats').then(setStats).catch(() => null).finally(() => setLoading(false))
  }, [])

  const totalSystems = stats?.total_ai_systems ?? 0
  const highRisk = (stats?.by_risk_tier?.high ?? 0) + (stats?.by_risk_tier?.unacceptable ?? 0)
  const avgCoverage = stats?.framework_coverage?.length
    ? Math.round(stats.framework_coverage.reduce((s, f) => s + f.coverage_pct, 0) / stats.framework_coverage.length)
    : 0

  const statCards = [
    {
      label: 'AI Systems',
      value: totalSystems,
      icon: Cpu,
      href: '/ai-systems',
      color: 'text-[#1B2A4A]',
      iconBg: 'bg-[#1B2A4A]/10',
      trend: 'Registered & tracked',
    },
    {
      label: 'High Risk',
      value: highRisk,
      icon: ShieldAlert,
      href: '/ai-systems',
      color: 'text-red-600',
      iconBg: 'bg-red-50',
      trend: 'Require immediate review',
    },
    {
      label: 'Open Incidents',
      value: stats?.open_incidents ?? 0,
      icon: AlertTriangle,
      href: '/incidents',
      color: 'text-orange-600',
      iconBg: 'bg-orange-50',
      trend: 'Active investigations',
    },
    {
      label: 'Assessments Done',
      value: stats?.completed_assessments ?? 0,
      icon: ClipboardCheck,
      href: '/assessments',
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      trend: 'Compliance verified',
    },
  ]

  return (
    <Shell>
      {/* ── Hero banner ── */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl px-8 py-7"
        style={{ background: 'linear-gradient(135deg, #0d1526 0%, #1B2A4A 60%, #1e3460 100%)' }}
      >
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div
          className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Live · AI Governance Platform</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Governance Overview</h1>
            <p className="mt-1 text-sm text-white/60">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/ai-systems/new"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-[#0d1526] transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bc6a 100%)' }}
              >
                <Cpu className="h-3.5 w-3.5" />Register AI System
              </Link>
              <Link
                href="/assessments"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <Activity className="h-3.5 w-3.5" />View Assessments
              </Link>
            </div>
          </div>

          {/* Compliance score ring */}
          <div className="hidden lg:flex flex-col items-center gap-2 text-center">
            {loading
              ? <div className="h-[120px] w-[120px] rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              : <ScoreRing score={avgCoverage} />
            }
            <div>
              <p className="text-xs font-semibold text-white/80">Compliance Score</p>
              <p className="text-[10px] text-white/50">avg across frameworks</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((c) => (
          <Link key={c.label} href={c.href} className="card group flex flex-col gap-3 p-5 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition group-hover:text-gray-500" />
            </div>
            {loading
              ? <div className="shimmer h-8 rounded w-12" />
              : <p className="text-3xl font-bold tracking-tight text-gray-900">{c.value}</p>
            }
            <div>
              <p className="text-sm font-semibold text-gray-700">{c.label}</p>
              <p className="text-xs text-gray-500">{c.trend}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Bottom section ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Framework Coverage */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Framework Coverage</h2>
            <Link href="/frameworks" className="ml-auto flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 space-y-5">
            {loading && [1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="shimmer h-4 rounded w-32" />
                <div className="shimmer h-3 rounded-full" />
              </div>
            ))}
            {!loading && (stats?.framework_coverage ?? []).map((fw) => {
              const pct = fw.coverage_pct
              const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
              const label = fwLabel[fw.framework_key] ?? fw.framework_key.replace(/_/g, ' ').toUpperCase()
              return (
                <div key={fw.framework_key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {pct < 40 ? 'Needs attention' : pct < 70 ? 'In progress' : 'On track'}
                  </p>
                </div>
              )
            })}
            {!loading && (stats?.framework_coverage ?? []).length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <FileCheck className="mb-3 h-8 w-8 text-gray-200" />
                <p className="text-sm font-medium text-gray-600">No coverage data yet</p>
                <p className="mt-1 text-xs text-gray-500">Complete an assessment to see framework coverage.</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Risk Distribution</h2>
          </div>
          <div className="p-5">
            {loading && [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mb-3 flex items-center gap-3">
                <div className="shimmer h-4 rounded w-20" />
                <div className="shimmer h-4 flex-1 rounded-full" />
                <div className="shimmer h-4 rounded w-6" />
              </div>
            ))}
            {!loading && stats && (
              <div className="space-y-3">
                {(['unacceptable', 'high', 'limited', 'minimal', 'unknown'] as const).map((tier) => {
                  const count = stats.by_risk_tier[tier] ?? 0
                  const pct = totalSystems > 0 ? Math.round((count / totalSystems) * 100) : 0
                  const c = tierColor[tier]
                  return (
                    <div key={tier} className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${c.dot}`} />
                      <span className="w-20 text-xs capitalize text-gray-700">{tier}</span>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`w-5 text-right text-xs font-bold tabular-nums ${c.text}`}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quick links */}
            {!loading && (
              <div className="mt-6 space-y-1 border-t border-gray-100 pt-4">
                {[
                  { label: 'Run Risk Assessment', href: '/ai-systems', icon: ShieldAlert },
                  { label: 'View All Incidents',  href: '/incidents',  icon: AlertTriangle },
                  { label: 'Compliance Reports',  href: '/reports',    icon: FileCheck },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <link.icon className="h-3.5 w-3.5 text-gray-400" />
                    {link.label}
                    <ChevronRight className="ml-auto h-3 w-3 text-gray-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
