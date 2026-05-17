'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { typedFetch } from '@/lib/api'

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

export default function ReportsPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [assetId, setAssetId] = useState('')
  const [framework, setFramework] = useState('eu_ai_act')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listAISystems().then((s) => {
      setSystems(s)
      if (s.length > 0) setAssetId(s[0].id)
    }).catch(() => null)
  }, [])

  const handleGenerate = async (): Promise<void> => {
    if (!assetId) return
    setError('')
    setLoading(true)
    try {
      const data = await typedFetch<Report>(`/v1/assets/${assetId}/report?framework=${framework}&format=json`)
      setReport(data)
    } catch {
      setError('Failed to generate report. Make sure a risk assessment has been computed for this system.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Reports</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        >
          {systems.length === 0 && <option value="">No AI systems found</option>}
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
        >
          {FRAMEWORKS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <Button onClick={handleGenerate} disabled={loading || !assetId}>
          {loading ? 'Generating...' : 'Generate report'}
        </Button>
      </div>

      {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {report && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-navy">
                {FRAMEWORKS.find((f) => f.value === report.framework_key)?.label ?? report.framework_key}
              </h2>
              <p className="text-xs text-gray-500">
                Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-navy">{report.risk_score}<span className="text-sm font-normal text-gray-400">/100</span></p>
              <p className="text-xs capitalize text-gray-500">Risk score · {report.risk_tier}</p>
            </div>
          </div>

          {report.risk_factors.length > 0 && (
            <>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Risk Factors</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="py-1 text-left">Code</th>
                    <th className="py-1 text-left">Description</th>
                    <th className="py-1 text-right">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {report.risk_factors.map((f) => (
                    <tr key={f.code} className="border-b border-gray-50">
                      <td className="py-1.5 font-mono text-xs text-gray-600">{f.code}</td>
                      <td className="py-1.5">{f.description}</td>
                      <td className="py-1.5 text-right text-gray-500">{f.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </Shell>
  )
}
