'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { typedFetch } from '@/lib/api'
import { FileText, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2, TrendingUp, ListChecks } from 'lucide-react'

const FRAMEWORKS = [
  { value: 'eu_ai_act', label: 'EU AI Act' },
  { value: 'nist_ai_rmf', label: 'NIST AI RMF' },
  { value: 'iso_42001', label: 'ISO 42001' },
]

interface Report {
  generated_at: string
  asset_id: string
  framework_key: string
  risk_tier: string
  risk_score: number
  risk_factors: Array<{ code: string; description: string; weight: number }>
  content_hash: string
}

const tierBadge: Record<string, string> = {
  unacceptable: 'bg-gray-900 text-white',
  high: 'bg-red-100 text-red-700',
  limited: 'bg-orange-100 text-orange-700',
  minimal: 'bg-emerald-100 text-emerald-700',
  unknown: 'bg-gray-100 text-gray-500',
}

const scoreColor = (s: number) =>
  s >= 75 ? 'text-red-600' : s >= 50 ? 'text-orange-500' : s >= 25 ? 'text-yellow-600' : 'text-emerald-600'
const scoreBg = (s: number) =>
  s >= 75 ? 'bg-red-500' : s >= 50 ? 'bg-orange-400' : s >= 25 ? 'bg-yellow-400' : 'bg-emerald-500'

export default function ReportsPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [assetId, setAssetId] = useState('')
  const [framework, setFramework] = useState('eu_ai_act')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [systemsLoading, setSystemsLoading] = useState(true)

  useEffect(() => {
    listAISystems()
      .then((s) => { setSystems(s); if (s.length > 0) setAssetId(s[0].id) })
      .catch(() => null)
      .finally(() => setSystemsLoading(false))
  }, [])

  const handleGenerate = async (): Promise<void> => {
    if (!assetId) return
    setError(''); setReport(null); setLoading(true)
    try {
      const data = await typedFetch<Report>(`/v1/assets/${assetId}/report?framework=${framework}&format=json`)
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report. Run a risk assessment first.')
    } finally { setLoading(false) }
  }

  const selectedSystem = systems.find((s) => s.id === assetId)
  const frameworkLabel = FRAMEWORKS.find((f) => f.value === framework)?.label ?? framework

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Reports</h1>
          <p className="page-subtitle">Generate audit-ready reports for any AI system and framework</p>
        </div>
      </div>

      {/* Config card */}
      <div className="card mb-4 animate-in">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-700">Report Configuration</h2>
        </div>
        <div className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="label">AI System</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              disabled={systemsLoading}
              className="input-base disabled:bg-gray-50"
            >
              {systems.length === 0 && <option value="">No AI systems found</option>}
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="input-base"
            >
              {FRAMEWORKS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !assetId}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {selectedSystem?.latest_risk_tier === 'unknown' && !report && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 flex items-start gap-2.5 mb-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
          <p>This system has no risk assessment yet. Go to <strong>AI Systems</strong> and run a risk assessment first.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-700 flex items-start gap-2.5 mb-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-in">
          <div className="card p-5">
            <div className="shimmer h-6 rounded w-64 mb-3" />
            <div className="shimmer h-4 rounded w-40 mb-4" />
            <div className="shimmer h-3 rounded-full w-full" />
          </div>
          <div className="card p-5">
            <div className="shimmer h-5 rounded w-32 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-gray-50">
                <div className="shimmer h-4 rounded w-20" />
                <div className="shimmer h-4 rounded flex-1" />
                <div className="shimmer h-4 rounded w-10" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!report && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No report generated</p>
          <p className="empty-body">Select a system and framework above, then click Generate Report.</p>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-4 animate-in">
          {/* Summary card */}
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">{frameworkLabel} Compliance Report</h2>
                </div>
                {selectedSystem && (
                  <p className="text-sm text-gray-500">{selectedSystem.name}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Generated {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize mb-1 ${tierBadge[report.risk_tier] ?? 'bg-gray-100 text-gray-500'}`}>
                  {report.risk_tier}
                </span>
                <div className={`text-3xl font-bold ${scoreColor(report.risk_score)}`}>
                  {report.risk_score}<span className="text-sm font-normal text-gray-400">/100</span>
                </div>
                <p className="text-xs text-gray-400">Risk Score</p>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-4">
              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${scoreBg(report.risk_score)}`}
                  style={{ width: `${report.risk_score}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Minimal risk</span>
                <span>Unacceptable risk</span>
              </div>
            </div>
          </div>

          {/* Report sections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                  <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Risk Assessment</h3>
              </div>
              <p className="text-xs text-gray-500">
                Overall risk tier: <span className="font-semibold text-gray-800 capitalize">{report.risk_tier}</span>.
                Score of {report.risk_score} out of 100 indicates{' '}
                {report.risk_score >= 75 ? 'critical attention required' :
                  report.risk_score >= 50 ? 'elevated risk requiring review' :
                  report.risk_score >= 25 ? 'moderate risk with some controls needed' :
                  'minimal risk with good governance posture'}.
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Framework Coverage</h3>
              </div>
              <p className="text-xs text-gray-500">
                Assessed against <span className="font-semibold text-gray-800">{frameworkLabel}</span>.
                {report.risk_factors.length} risk factors identified
                across this framework's control domains.
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Recommendations</h3>
              </div>
              <p className="text-xs text-gray-500">
                {report.risk_score >= 50
                  ? 'Priority: Address high-weight risk factors to reduce overall score.'
                  : 'Continue monitoring and maintain current governance controls.'}
              </p>
            </div>
          </div>

          {/* Risk factors table */}
          {report.risk_factors.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">Risk Factors</h3>
                </div>
                <span className="text-xs text-gray-400">{report.risk_factors.length} factors</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Factor Code</th>
                    <th>Description</th>
                    <th className="text-right">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {report.risk_factors.map((f) => (
                    <tr key={f.code}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-50 rounded px-1.5 py-0.5">
                          {f.code}
                        </span>
                      </td>
                      <td className="text-gray-700">{f.description}</td>
                      <td className="text-right tabular-nums font-medium text-gray-600">{f.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between card px-5 py-4">
            <div>
              <p className="text-xs text-gray-400">Content hash</p>
              <p className="mt-0.5 font-mono text-xs text-gray-500">{report.content_hash}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Export PDF
            </button>
          </div>
        </div>
      )}
    </Shell>
  )
}
