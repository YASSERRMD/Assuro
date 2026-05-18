'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listAuditEntries, listAuditActions, exportAuditLog, type AuditEntry, type AuditFilters } from '@/lib/api/audit'
import { ScrollText, Download, Filter, RefreshCw } from 'lucide-react'

const resourceColor: Record<string, string> = {
  ai_system: 'bg-blue-50 text-blue-700',
  agent: 'bg-cyan-50 text-cyan-700',
  incident: 'bg-red-50 text-red-700',
  policy: 'bg-emerald-50 text-emerald-700',
  user: 'bg-purple-50 text-purple-700',
  vendor: 'bg-orange-50 text-orange-700',
  role: 'bg-indigo-50 text-indigo-700',
}

export default function AuditPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState<AuditFilters>({})
  const [draftFilters, setDraftFilters] = useState<AuditFilters>({})

  const fetchEntries = (f: AuditFilters = {}): void => {
    setLoading(true)
    listAuditEntries(f)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    listAuditActions().then(setActions).catch(() => setActions([]))
    fetchEntries()
  }, [])

  const handleApplyFilters = (): void => {
    setFilters(draftFilters)
    fetchEntries(draftFilters)
  }

  const handleResetFilters = (): void => {
    setDraftFilters({})
    setFilters({})
    fetchEntries({})
  }

  const handleExport = async (): Promise<void> => {
    setExporting(true)
    try {
      const blob = await exportAuditLog(filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast('Audit log exported.', 'success')
    } catch {
      toast('Failed to export audit log.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Immutable record of all platform actions</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters card */}
      <div className="card mb-4 animate-in">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Action</label>
              <select
                value={draftFilters.action ?? ''}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, action: e.target.value || undefined }))}
                className="input-base"
              >
                <option value="">All actions</option>
                {actions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Actor Email</label>
              <input
                className="input-base"
                value={draftFilters.actor_email ?? ''}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, actor_email: e.target.value || undefined }))}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                className="input-base"
                value={draftFilters.from ?? ''}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from: e.target.value || undefined }))}
              />
            </div>
            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                className="input-base"
                value={draftFilters.to ?? ''}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to: e.target.value || undefined }))}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card overflow-hidden animate-in">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-32" />
                <div className="shimmer h-5 rounded w-28" />
                <div className="shimmer h-4 rounded w-40" />
                <div className="shimmer h-5 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <ScrollText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No audit entries found</p>
          <p className="empty-body">
            {hasFilters
              ? 'Try adjusting your filters to see more results.'
              : 'Actions will appear here as users interact with the platform.'}
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="card overflow-hidden animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Resource</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="rounded-md bg-[#1B2A4A]/5 px-2 py-0.5 font-mono text-xs font-semibold text-[#1B2A4A]">
                      {entry.action}
                    </span>
                  </td>
                  <td className="text-xs text-gray-700">{entry.actor_email}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${resourceColor[entry.resource_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {entry.resource_type}
                      </span>
                      <span className="font-mono text-[10px] text-gray-400">{entry.resource_id.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-400">{entry.ip_address ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
