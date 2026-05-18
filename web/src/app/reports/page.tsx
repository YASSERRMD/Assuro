'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { typedFetch } from '@/lib/api'
import { FileText, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { RiskBadge } from '@/components/risk/RiskBadge'

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

const scoreColor = (s: number) => s >= 75 ? 'text-red-600' : s >= 50 ? 'text-orange-500' : s >= 25 ? 'text-yellow-600' : 'text-emerald-600'
const scoreBg = (s: number) => s >= 75 ? 'bg-red-500' : s >= 50 ? 'bg-orange-400' : s >= 25 ? 'bg-yellow-400' : 'bg-emerald-500'

export default function ReportsPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [assetId, setAssetId] = useState('')
  const [framework, setFramework] = useState('eu_ai_act')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [systemsLoading, setSystemsLoading] = useState(true)

  useEffect(() => {
    listAISystems().then((s) => { setSystems(s); if (s.length > 0) setAssetId(s[0].id) }).catch(() => null).finally(() => setSystemsLoading(false))
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
        <p className="mt-0.5 text-sm text-gray-500">Generate audit-ready reports for any AI system and framework</p>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Report Configuration</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">AI System</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} disabled={systemsLoading}
              className="h-9 min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10 disabled:bg-gray-50">
              {systems.length === 0 && <option value="">No AI systems found</option>}
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Framework</label>
            <select value={framework} onChange={(e) => setFramework(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
              {FRAMEWORKS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !assetId} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating…' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!report && !loading && !error && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <FileText className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Select a system and framework above, then click Generate Report.</p>
        </div>
      )}

      {report && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">{frameworkLabel} Compliance Report</h2>
                </div>
                {selectedSystem && <p className="mt-1 text-sm text-gray-500">{selectedSystem.name}</p>}
                <p className="mt-1 text-xs text-gray-400">Generated {new Date(report.generated_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <RiskBadge tier={report.risk_tier} />
                  <span className={`text-3xl font-bold ${scoreColor(report.risk_score)}`}>
                    {report.risk_score}<span className="text-sm font-normal text-gray-400">/100</span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">Risk Score</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div className={`h-2.5 rounded-full transition-all duration-700 ${scoreBg(report.risk_score)}`} style={{ width: `${report.risk_score}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400"><span>Minimal risk</span><span>Unacceptable risk</span></div>
            </div>
          </div>

          {report.risk_factors.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/60 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-700">Risk Factors</h3>
                <span className="text-xs text-gray-400">{report.risk_factors.length} factors</span>
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Factor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.risk_factors.map((f) => (
                    <tr key={f.code} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-600">{f.code}</td>
                      <td className="px-5 py-3 text-gray-700">{f.description}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-500">{f.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-card">
            <div>
              <p className="text-xs text-gray-400">Content hash</p>
              <p className="mt-0.5 font-mono text-xs text-gray-500">{report.content_hash}</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Download className="h-4 w-4" />Export
            </Button>
          </div>
        </div>
      )}
    </Shell>
  )
}
