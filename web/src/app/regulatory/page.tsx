'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import {
  listRegulatoryChanges,
  listRegulatoryImpacts,
  type RegulatoryChange,
  type RegulatoryImpact,
} from '@/lib/api/regulatory'
import { Scale, Globe, ExternalLink } from 'lucide-react'

type Tab = 'changes' | 'impacts'

const changeKindBadge: Record<string, string> = {
  added:     'bg-emerald-100 text-emerald-700',
  amended:   'bg-amber-100 text-amber-700',
  removed:   'bg-red-100 text-red-700',
  clarified: 'bg-blue-100 text-blue-700',
}

const frameworkBadge: Record<string, string> = {
  EU_AI_ACT:   'bg-purple-100 text-purple-700',
  GDPR:        'bg-indigo-100 text-indigo-700',
  NIST_AI_RMF: 'bg-blue-100 text-blue-700',
  ISO_42001:   'bg-teal-100 text-teal-700',
}

const impactBadge: Record<string, string> = {
  high:     'bg-red-100 text-red-700',
  critical: 'bg-red-100 text-red-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-gray-100 text-gray-500',
}

const statusBadge: Record<string, string> = {
  resolved: 'bg-emerald-100 text-emerald-700',
  open:     'bg-amber-100 text-amber-700',
  pending:  'bg-blue-100 text-blue-700',
}

export default function RegulatoryPage() {
  const [changes, setChanges] = useState<RegulatoryChange[]>([])
  const [impacts, setImpacts] = useState<RegulatoryImpact[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('changes')

  useEffect(() => {
    Promise.all([
      listRegulatoryChanges().catch(() => [] as RegulatoryChange[]),
      listRegulatoryImpacts().catch(() => [] as RegulatoryImpact[]),
    ]).then(([c, i]) => { setChanges(c); setImpacts(i) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Regulatory Intelligence</h1>
          <p className="page-subtitle">Track regulatory changes and their impact on AI systems</p>
        </div>
      </div>

      <div className="tab-nav mb-4 animate-in">
        {(['changes', 'impacts'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'active' : ''}`}>
            {t === 'changes' ? 'Regulatory Changes' : 'Impact Assessments'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-5 rounded-full w-20 ml-auto" />
                <div className="shimmer h-4 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'changes' && (
        <>
          {changes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Scale className="h-6 w-6 text-gray-400" /></div>
              <p className="empty-title">No regulatory changes tracked</p>
              <p className="empty-body">Regulatory changes will appear here as frameworks publish updates.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Summary</th>
                    <th>Framework</th>
                    <th>Ref</th>
                    <th>Change</th>
                    <th>Effective</th>
                    <th className="text-right">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((change) => (
                    <tr key={change.id}>
                      <td>
                        <p className="text-sm text-gray-800 max-w-sm leading-snug line-clamp-2">
                          {change.summary}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Published {new Date(change.published_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${frameworkBadge[change.framework_key] ?? 'bg-gray-100 text-gray-600'}`}>
                          {change.framework_key.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gray-600 bg-gray-50 rounded px-1.5 py-0.5">
                          {change.ref_code}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${changeKindBadge[change.change_kind] ?? 'bg-gray-100 text-gray-500'}`}>
                          {change.change_kind}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500">
                        {change.effective_date ? new Date(change.effective_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-right">
                        {change.source_url ? (
                          <a
                            href={change.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#1B2A4A] hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && tab === 'impacts' && (
        <>
          {impacts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Scale className="h-6 w-6 text-gray-400" /></div>
              <p className="empty-title">No impact assessments</p>
              <p className="empty-body">Impact assessments link regulatory changes to specific AI systems.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Change</th>
                    <th>System</th>
                    <th>Impact Level</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {impacts.map((impact) => (
                    <tr key={impact.id}>
                      <td className="font-medium text-gray-900">{impact.description}</td>
                      <td className="text-xs text-gray-500 font-mono">
                        {impact.asset_id ? impact.asset_id.slice(0, 8) + '...' : '—'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${impactBadge[impact.severity] ?? 'bg-gray-100 text-gray-500'}`}>
                          {impact.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[impact.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {impact.status}
                        </span>
                      </td>
                      <td className="text-xs text-gray-400 max-w-xs truncate">{impact.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Shell>
  )
}
