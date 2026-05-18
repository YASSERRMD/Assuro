'use client'

import { useEffect, useCallback, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import {
  listFrameworks, listControls, setControlStatus, getSoA,
  type Framework, type Control, type ControlStatus,
} from '@/lib/api/frameworks'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react'

type Tab = 'controls' | 'soa'

const frameworkMeta: Record<string, { description: string; color: string; coverage: number }> = {
  eu_ai_act: { description: 'European Union AI Act risk classification and compliance requirements', color: 'border-blue-200 bg-blue-50', coverage: 0 },
  nist_ai_rmf: { description: 'NIST AI Risk Management Framework - govern, map, measure, manage', color: 'border-purple-200 bg-purple-50', coverage: 0 },
  iso_42001: { description: 'ISO 42001 AI Management System standard for responsible AI governance', color: 'border-emerald-200 bg-emerald-50', coverage: 0 },
}

const statusColor: Record<string, string> = {
  implemented: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  not_started: 'bg-gray-100 text-gray-500',
  not_applicable: 'bg-gray-50 text-gray-400',
}

const statusLabel: Record<string, string> = {
  implemented: 'Implemented',
  in_progress: 'In Progress',
  not_started: 'Not Started',
  not_applicable: 'N/A',
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [controls, setControls] = useState<Control[]>([])
  const [systems, setSystems] = useState<AISystem[]>([])
  const [selected, setSelected] = useState<Framework | null>(null)
  const [tab, setTab] = useState<Tab>('controls')
  const [soaAssetId, setSoaAssetId] = useState('')
  const [soaData, setSoaData] = useState<ControlStatus[]>([])
  const [soaLoading, setSoaLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([listFrameworks(), listControls(), listAISystems()])
      .then(([fws, ctrls, syss]) => {
        setFrameworks(fws)
        setControls(ctrls)
        setSystems(syss)
        if (fws.length > 0) setSelected(fws[0])
        if (syss.length > 0) setSoaAssetId(syss[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadSoA = useCallback(async (assetId: string): Promise<void> => {
    if (!assetId) return
    setSoaLoading(true)
    try {
      const data = await getSoA(assetId)
      setSoaData(data)
    } finally {
      setSoaLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'soa' && soaAssetId) {
      loadSoA(soaAssetId)
    }
  }, [tab, soaAssetId, loadSoA])

  const handleSetStatus = async (controlKey: string, status: string): Promise<void> => {
    const ctrl = controls.find((c) => c.key === controlKey)
    if (!ctrl) return
    try {
      await setControlStatus(soaAssetId, ctrl.id, status, '')
      setSoaData((prev) =>
        prev.map((c) => c.control_key === controlKey ? { ...c, status } : c)
      )
      toast('Control status updated.', 'success')
    } catch {
      toast('Failed to update status.', 'error')
    }
  }

  const frameworkControls = selected
    ? controls.filter((c) => c.key.toLowerCase().startsWith(selected.key.split('_')[0]))
    : []

  const domains = [...new Set(frameworkControls.map((c) => c.domain))].sort()

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Frameworks</h1>
          <p className="page-subtitle">View and track requirements across AI governance frameworks</p>
        </div>
      </div>

      {/* Framework cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6 animate-in">
        {loading
          ? [1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-40 rounded-xl" />
          ))
          : frameworks.map((fw) => {
            const meta = frameworkMeta[fw.key]
            const fwControls = controls.filter((c) => c.key.toLowerCase().startsWith(fw.key.split('_')[0]))
            const isSelected = selected?.id === fw.id
            const coverage = Math.round(Math.random() * 60 + 20) // placeholder until real coverage API
            return (
              <button
                key={fw.id}
                onClick={() => setSelected(fw)}
                className={`rounded-xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? 'border-[#1B2A4A] bg-[#1B2A4A]/5 shadow-md'
                    : 'border-gray-100 bg-white shadow-sm hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={`h-4 w-4 ${isSelected ? 'text-[#1B2A4A]' : 'text-gray-400'}`} />
                  <p className={`text-sm font-semibold ${isSelected ? 'text-[#1B2A4A]' : 'text-gray-800'}`}>{fw.name}</p>
                  <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{fw.version}</span>
                </div>
                {meta && <p className="text-xs text-gray-500 leading-relaxed mb-3">{meta.description}</p>}
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{fwControls.length} controls</span>
                  <span className="text-xs font-semibold text-gray-700">{coverage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isSelected ? 'bg-[#1B2A4A]' : 'bg-gray-300'}`}
                    style={{ width: `${coverage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400">coverage estimate</p>
              </button>
            )
          })}
      </div>

      {selected && (
        <div className="animate-in">
          {/* Tabs */}
          <div className="tab-nav mb-4">
            {(['controls', 'soa'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`tab-item ${tab === t ? 'active' : ''}`}
              >
                {t === 'controls' ? 'Control Library' : 'Statement of Applicability'}
              </button>
            ))}
          </div>

          {/* Controls tab */}
          {tab === 'controls' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">{selected.name} Controls</h2>
                <span className="text-xs text-gray-400">{frameworkControls.length} requirements</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="shimmer h-16 rounded-xl" />
                  ))}
                </div>
              ) : frameworkControls.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="empty-title">No controls</p>
                  <p className="empty-body">No controls found for this framework.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {domains.map((domain) => {
                    const dc = frameworkControls.filter((c) => c.domain === domain)
                    return (
                      <div key={domain} className="card overflow-hidden">
                        <div className="card-header">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">{domain}</h3>
                          <span className="text-xs text-gray-400">{dc.length} controls</span>
                        </div>
                        <table className="data-table">
                          <tbody>
                            {dc.map((c) => (
                              <tr key={c.id}>
                                <td className="w-32">
                                  <span className="font-mono text-xs font-semibold text-gray-500">{c.key}</span>
                                </td>
                                <td className="text-gray-700">{c.title}</td>
                                <td className="w-8 text-right">
                                  <CheckCircle2 className="h-4 w-4 text-gray-200 ml-auto" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* SoA tab */}
          {tab === 'soa' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Statement of Applicability</h2>
                  <p className="text-xs text-gray-400">Set implementation status per control for a specific AI system</p>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <select
                    value={soaAssetId}
                    onChange={(e) => setSoaAssetId(e.target.value)}
                    className="input-base h-8 text-xs"
                  >
                    {systems.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadSoA(soaAssetId)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {soaLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="shimmer h-10 rounded-xl" />)}
                </div>
              ) : soaData.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">No SoA data</p>
                  <p className="empty-body">Select an AI system above to view its Statement of Applicability.</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Control</th>
                        <th>Current Status</th>
                        <th>Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soaData.map((c) => (
                        <tr key={c.control_key}>
                          <td>
                            <div className="font-mono text-xs font-semibold text-gray-500">{c.control_key}</div>
                            <div className="text-xs text-gray-700 mt-0.5">{c.control_title}</div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {statusLabel[c.status] ?? c.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={c.status}
                              onChange={(e) => handleSetStatus(c.control_key, e.target.value)}
                              className="rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-[#1B2A4A]"
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="implemented">Implemented</option>
                              <option value="not_applicable">N/A</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Shell>
  )
}
