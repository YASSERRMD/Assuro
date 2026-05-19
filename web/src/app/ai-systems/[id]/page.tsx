'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { RiskBadge } from '@/components/risk/RiskBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  getAISystem, computeRisk, getRisk, getRiskHistory,
  type AISystem, type RiskAssessment,
} from '@/lib/api/aisystems'
import {
  Cpu, ShieldCheck, Zap, Activity, RefreshCw,
  ArrowLeft, Hash, Box, Server,
} from 'lucide-react'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-2.5 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-right text-sm text-gray-800">{value ?? <span className="text-gray-300">—</span>}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-gray-50 px-5 py-4">
        <Icon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

const riskTierColors: Record<string, string> = {
  unacceptable: 'bg-black text-white',
  high: 'bg-red-100 text-red-800',
  limited: 'bg-orange-100 text-orange-800',
  minimal: 'bg-emerald-100 text-emerald-800',
  unknown: 'bg-gray-100 text-gray-500',
}

export default function AISystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [system, setSystem] = useState<AISystem | null>(null)
  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [history, setHistory] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [assetId, setAssetId] = useState('')

  useEffect(() => {
    params.then(async (p) => {
      setAssetId(p.id)
      try {
        const [sys, r, hist] = await Promise.all([
          getAISystem(p.id),
          getRisk(p.id),
          getRiskHistory(p.id).catch(() => [] as RiskAssessment[]),
        ])
        setSystem(sys)
        setRisk(r)
        setHistory(hist)
      } catch {
        toast('Failed to load system details.', 'error')
      } finally {
        setLoading(false)
      }
    })
  }, [params])

  const handleComputeRisk = async (): Promise<void> => {
    if (!assetId) return
    setComputing(true)
    try {
      const r = await computeRisk(assetId)
      setRisk(r)
      setHistory((prev) => [r, ...prev].slice(0, 10))
      toast('Risk assessment completed.', 'success')
    } catch {
      toast('Risk computation failed. Check that all system details are complete.', 'error')
    } finally {
      setComputing(false)
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <SkeletonText lines={6} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  if (!system) {
    return (
      <Shell>
        <div className="mt-20 flex flex-col items-center gap-4 text-center">
          <p className="text-gray-500">AI system not found.</p>
          <Button variant="ghost" onClick={() => router.push('/ai-systems')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to AI Systems
          </Button>
        </div>
      </Shell>
    )
  }

  const riskScoreWidth = risk ? Math.min(risk.score, 100) : 0
  const riskScoreColor = risk
    ? risk.score >= 75 ? 'bg-red-500'
      : risk.score >= 50 ? 'bg-orange-400'
        : risk.score >= 25 ? 'bg-yellow-400'
          : 'bg-emerald-500'
    : 'bg-gray-200'

  return (
    <Shell>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push('/ai-systems')}
            className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{system.name}</h1>
              <RiskBadge tier={system.latest_risk_tier} />
            </div>
            {system.description && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{system.description}</p>
            )}
          </div>
        </div>
        <Button onClick={handleComputeRisk} disabled={computing} className="flex-shrink-0 gap-2">
          <RefreshCw className={`h-4 w-4 ${computing ? 'animate-spin' : ''}`} />
          {computing ? 'Computing…' : 'Compute Risk'}
        </Button>
      </div>

      {/* Content grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="System Information" icon={Cpu}>
            <DetailRow label="Provider" value={system.provider} />
            <DetailRow label="Intended Purpose" value={system.intended_purpose} />
            <DetailRow label="Model Family" value={system.model_family} />
            <DetailRow label="Modality" value={system.modality} />
            <DetailRow label="Deployment Context" value={system.deployment_context} />
            <DetailRow label="Lifecycle Status" value={
              system.lifecycle_status
                ? <span className="capitalize">{system.lifecycle_status}</span>
                : null
            } />
            <DetailRow label="Lifecycle Stage" value={
              system.lifecycle_stage
                ? <span className="capitalize">{system.lifecycle_stage}</span>
                : null
            } />
            <DetailRow label="Autonomy Level" value={
              system.autonomy_level != null ? `Level ${system.autonomy_level}` : null
            } />
          </SectionCard>

          <SectionCard title="Governance Flags" icon={ShieldCheck}>
            <DetailRow label="EU Market Exposure" value={
              <Badge variant={system.eu_market_exposure ? 'warning' : 'default'}>
                {system.eu_market_exposure ? 'Exposed' : 'Not exposed'}
              </Badge>
            } />
            <DetailRow label="Agentic Behavior" value={
              <Badge variant={system.is_agentic ? 'danger' : 'default'}>
                {system.is_agentic ? 'Agentic' : 'Non-agentic'}
              </Badge>
            } />
            <DetailRow label="Asset Type" value={
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{system.asset_type}</span>
            } />
          </SectionCard>

          {history.length > 0 && (
            <SectionCard title="Risk Assessment History" icon={Activity}>
              <div className="py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-xs text-gray-400">
                      <th className="pb-2 text-left font-medium">Tier</th>
                      <th className="pb-2 text-left font-medium">Score</th>
                      <th className="pb-2 text-left font-medium">Ruleset</th>
                      <th className="pb-2 text-left font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((h, i) => (
                      <tr key={h.id} className={i === 0 ? 'font-medium' : 'text-gray-500'}>
                        <td className="py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${riskTierColors[h.tier] ?? riskTierColors.unknown}`}>
                            {h.tier}
                          </span>
                        </td>
                        <td className="py-2">{h.score}/100</td>
                        <td className="py-2 font-mono text-xs text-gray-400">{h.ruleset_version}</td>
                        <td className="py-2 text-xs">{new Date(h.computed_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SectionCard title="Current Risk" icon={Zap}>
            {risk ? (
              <div className="py-3">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${riskTierColors[risk.tier] ?? riskTierColors.unknown}`}>
                    {risk.tier}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {risk.score}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                  </span>
                </div>

                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${riskScoreColor}`}
                      style={{ width: `${riskScoreWidth}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {risk.factors.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Risk Factors</p>
                    <div className="space-y-2">
                      {risk.factors.map((f) => (
                        <div key={f.code} className="rounded-lg bg-gray-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-gray-600">{f.code}</span>
                            <span className="text-xs text-gray-400">w={f.weight}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-400">
                  Computed {new Date(risk.computed_at).toLocaleString()} · {risk.ruleset_version}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center">
                <Zap className="mx-auto h-8 w-8 text-gray-200" />
                <p className="mt-2 text-sm text-gray-500">No risk assessment yet</p>
                <p className="mt-1 text-xs text-gray-400">Click &ldquo;Compute Risk&rdquo; to run the EU AI Act risk engine.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Identifiers" icon={Hash}>
            <div className="py-2">
              <p className="text-xs text-gray-400">System ID</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-600">{system.id}</p>
            </div>
          </SectionCard>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Actions</p>
            <div className="space-y-2">
              <a
                href="/assessments"
                className="flex w-full items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Box className="h-3.5 w-3.5 text-gray-400" />
                View Assessments
              </a>
              <a
                href="/reports"
                className="flex w-full items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Server className="h-3.5 w-3.5 text-gray-400" />
                Generate Report
              </a>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
