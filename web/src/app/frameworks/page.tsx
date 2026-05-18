'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { listFrameworks, listControls, type Framework, type Control } from '@/lib/api/frameworks'
import { BookOpen, CheckCircle2, Circle, ChevronRight } from 'lucide-react'

const frameworkMeta: Record<string, { description: string; color: string }> = {
  eu_ai_act: { description: 'European Union AI Act risk classification and compliance requirements', color: 'bg-blue-50 border-blue-200' },
  nist_ai_rmf: { description: 'NIST AI Risk Management Framework — govern, map, measure, manage', color: 'bg-purple-50 border-purple-200' },
  iso_42001: { description: 'ISO 42001 AI Management System standard for responsible AI governance', color: 'bg-emerald-50 border-emerald-200' },
}

const frameworkBadgeColor: Record<string, string> = {
  eu_ai_act: 'bg-blue-100 text-blue-700',
  nist_ai_rmf: 'bg-purple-100 text-purple-700',
  iso_42001: 'bg-emerald-100 text-emerald-700',
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [controls, setControls] = useState<Control[]>([])
  const [selected, setSelected] = useState<Framework | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listFrameworks(), listControls()])
      .then(([fws, ctrls]) => {
        setFrameworks(fws)
        setControls(ctrls)
        if (fws.length > 0) setSelected(fws[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const frameworkControls = selected
    ? controls.filter((c) => c.key.toLowerCase().startsWith(selected.key.split('_')[0]))
    : []

  const domains = [...new Set(frameworkControls.map((c) => c.domain))].sort()

  return (
    <Shell>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Frameworks</h1>
        <p className="mt-0.5 text-sm text-gray-500">View and track requirements across AI governance frameworks</p>
      </div>

      {/* Framework selector cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))
          : frameworks.map((fw) => {
            const meta = frameworkMeta[fw.key]
            const isSelected = selected?.id === fw.id
            const fwControls = controls.filter((c) => c.key.toLowerCase().startsWith(fw.key.split('_')[0]))
            return (
              <button
                key={fw.id}
                onClick={() => setSelected(fw)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-[#0f1f3d] bg-[#0f1f3d]/5 shadow-card-md'
                    : 'border-gray-100 bg-white shadow-card hover:border-gray-200 hover:shadow-card-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-[#0f1f3d]' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#0f1f3d]' : 'text-gray-800'}`}>{fw.name}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${frameworkBadgeColor[fw.key] ?? 'bg-gray-100 text-gray-600'}`}>
                    {fw.version}
                  </span>
                </div>
                {meta && <p className="mt-2 text-xs leading-relaxed text-gray-500">{meta.description}</p>}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                  <Circle className="h-3 w-3" />
                  <span>{fwControls.length} controls</span>
                  {isSelected && <ChevronRight className="ml-auto h-3 w-3 text-[#0f1f3d]" />}
                </div>
              </button>
            )
          })}
      </div>

      {/* Controls list */}
      {selected && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {selected.name} Controls
            </h2>
            <span className="text-sm text-gray-400">{frameworkControls.length} requirements</span>
          </div>

          {loading ? (
            <div className="mt-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : frameworkControls.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-200" />
              <p className="mt-2 text-sm text-gray-400">No controls found for this framework.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {domains.map((domain) => {
                const domainControls = frameworkControls.filter((c) => c.domain === domain)
                return (
                  <div key={domain} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
                    <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/60 px-4 py-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">{domain}</h3>
                      <span className="text-xs text-gray-400">{domainControls.length}</span>
                    </div>
                    <table className="w-full border-collapse text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {domainControls.map((c) => (
                          <tr key={c.id} className="transition-colors hover:bg-gray-50/60">
                            <td className="w-32 px-4 py-3">
                              <span className="font-mono text-xs font-semibold text-gray-500">{c.key}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{c.title}</td>
                            <td className="w-10 px-4 py-3 text-right">
                              <CheckCircle2 className="ml-auto h-4 w-4 text-gray-200" />
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
    </Shell>
  )
}
