'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { listAssessments, listAssessmentTemplates, type Assessment, type AssessmentTemplate } from '@/lib/api/assessments'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { ClipboardList } from 'lucide-react'

const statusConfig: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'bg-gray-100 text-gray-600', label: 'Draft' },
  in_progress: { badge: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  in_review: { badge: 'bg-amber-100 text-amber-700', label: 'In Review' },
  completed: { badge: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
  cancelled: { badge: 'bg-gray-100 text-gray-400', label: 'Cancelled' },
}

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { badge: 'bg-gray-100 text-gray-500', label: status }
}

const frameworkLabels: Record<string, string> = {
  eu_ai_act: 'EU AI Act',
  eu_ai_act_high_risk: 'EU AI Act',
  nist_ai_rmf: 'NIST AI RMF',
  iso_42001: 'ISO 42001',
}

function getFrameworkLabel(templateKey: string): string {
  for (const [k, v] of Object.entries(frameworkLabels)) {
    if (templateKey.startsWith(k)) return v
  }
  return templateKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const frameworkFilters = ['all', 'eu_ai_act', 'nist_ai_rmf', 'iso_42001']

export default function AssessmentsPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [systems, setSystems] = useState<AISystem[]>([])
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [frameworkFilter, setFrameworkFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      listAssessments(),
      listAISystems(),
      listAssessmentTemplates().catch(() => [] as AssessmentTemplate[]),
    ])
      .then(([a, s, t]) => {
        setAssessments(a)
        setSystems(s)
        setTemplates(t)
      })
      .finally(() => setLoading(false))
  }, [])

  const systemMap = Object.fromEntries(systems.map((s) => [s.id, s.name]))
  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t]))

  const filtered = frameworkFilter === 'all'
    ? assessments
    : assessments.filter((a) => {
        const tpl = templateMap[a.template_id]
        return tpl ? tpl.key.startsWith(frameworkFilter.replace('eu_ai_act', 'eu_ai_act')) : false
      })

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assessments</h1>
          <p className="page-subtitle">Compliance assessments across AI systems</p>
        </div>
        <Link
          href="/ai-systems"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          + New Assessment
        </Link>
      </div>

      {/* Framework filter */}
      <div className="flex gap-2 mb-4 animate-in">
        {frameworkFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFrameworkFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              frameworkFilter === f
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All Frameworks' : (frameworkLabels[f] ?? f)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-32" />
                <div className="shimmer h-4 rounded w-24" />
                <div className="shimmer h-5 rounded-full w-20 ml-auto" />
                <div className="shimmer h-4 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <ClipboardList className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No assessments found</p>
          <p className="empty-body">
            {assessments.length === 0
              ? 'Open an AI system and start an assessment from its detail page.'
              : 'No assessments match the selected framework.'}
          </p>
          <Link
            href="/ai-systems"
            className="mt-3 text-sm font-medium text-[#1B2A4A] underline underline-offset-4 hover:opacity-70"
          >
            View AI Systems
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Framework</th>
                <th>AI System</th>
                <th>Status</th>
                <th>Created</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const sc = getStatusConfig(a.status)
                const tpl = templateMap[a.template_id]
                const fwLabel = tpl ? getFrameworkLabel(tpl.key) : '-'
                const systemName = systemMap[a.asset_id] ?? a.asset_id.slice(0, 8) + '…'
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/assessments/${a.id}`)}
                  >
                    <td>
                      <Link
                        href={`/assessments/${a.id}`}
                        className="font-mono text-xs font-medium text-[#1B2A4A] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.id.slice(0, 8)}…
                      </Link>
                      {tpl && (
                        <div className="text-[10px] text-gray-400 mt-0.5">{tpl.title}</div>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-gray-700">{fwLabel}</span>
                    </td>
                    <td>
                      <Link
                        href={`/ai-systems/${a.asset_id}`}
                        className="text-xs font-medium text-gray-700 hover:text-[#1B2A4A]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {systemName}
                      </Link>
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="text-gray-500 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="text-gray-400 text-xs">
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} assessment{filtered.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}
    </Shell>
  )
}
