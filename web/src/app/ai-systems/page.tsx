'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { Plus, Search, Cpu } from 'lucide-react'

const riskBadge: Record<string, string> = {
  unacceptable: 'bg-gray-900 text-white',
  high: 'bg-red-100 text-red-700',
  limited: 'bg-orange-100 text-orange-700',
  minimal: 'bg-emerald-100 text-emerald-700',
  unknown: 'bg-gray-100 text-gray-500',
}

const statusDot: Record<string, string> = {
  active: 'bg-emerald-400',
  inactive: 'bg-gray-300',
  deprecated: 'bg-red-400',
  development: 'bg-blue-400',
}

export default function AISystemsPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')

  useEffect(() => {
    listAISystems().then(setSystems).finally(() => setLoading(false))
  }, [])

  const filtered = systems.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.provider ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRisk = riskFilter === 'all' || s.latest_risk_tier === riskFilter
    return matchSearch && matchRisk
  })

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Systems</h1>
          <p className="page-subtitle">Inventory of AI systems under governance</p>
        </div>
        <a
          href="/ai-systems/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register System
        </a>
      </div>

      {/* Search + filter bar */}
      <div className="card mb-4 animate-in">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or provider..."
              className="input-base pl-9"
            />
          </div>
          <div className="flex gap-1">
            {['all', 'unacceptable', 'high', 'limited', 'minimal', 'unknown'].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  riskFilter === r
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="card animate-in">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-4 rounded w-24 ml-auto" />
                <div className="shimmer h-5 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Cpu className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">
            {systems.length === 0 ? 'No AI systems yet' : 'No results found'}
          </p>
          <p className="empty-body">
            {systems.length === 0
              ? 'Register your first AI system to start tracking governance and risk.'
              : 'Try adjusting your search or filter.'}
          </p>
          {systems.length === 0 && (
            <a
              href="/ai-systems/new"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
            >
              <Plus className="h-4 w-4" />Register System
            </a>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Risk Tier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => { window.location.href = `/ai-systems/${s.id}` }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot[s.lifecycle_status] ?? 'bg-gray-300'}`}
                        title={s.lifecycle_status}
                      />
                      <a
                        href={`/ai-systems/${s.id}`}
                        className="font-medium text-[#1B2A4A] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.name}
                      </a>
                    </div>
                  </td>
                  <td className="text-gray-500">{s.provider || <span className="text-gray-300">-</span>}</td>
                  <td className="text-gray-500 capitalize">{s.asset_type || '-'}</td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${riskBadge[s.latest_risk_tier] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {s.latest_risk_tier || 'unknown'}
                    </span>
                  </td>
                  <td className="capitalize text-gray-500">{s.lifecycle_status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'system' : 'systems'} shown
          </div>
        </div>
      )}
    </Shell>
  )
}
