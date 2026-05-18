'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listAuditEntries, listAuditActions, exportAuditLog, type AuditEntry, type AuditFilters } from '@/lib/api/audit'
import { ScrollText, Download, Filter, RefreshCw } from 'lucide-react'

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

  const resourceTypeColor: Record<string, string> = {
    ai_system: 'bg-blue-50 text-blue-700',
    agent: 'bg-cyan-50 text-cyan-700',
    incident: 'bg-red-50 text-red-700',
    policy: 'bg-emerald-50 text-emerald-700',
    user: 'bg-purple-50 text-purple-700',
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="mt-0.5 text-sm text-gray-500">Immutable record of all platform actions</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">Filters</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Action</label>
            <select
              value={draftFilters.action ?? ''}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, action: e.target.value || undefined }))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10"
            >
              <option value="">All actions</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Input
            label="Actor Email"
            value={draftFilters.actor_email ?? ''}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, actor_email: e.target.value || undefined }))}
            placeholder="user@example.com"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">From Date</label>
            <input
              type="date"
              value={draftFilters.from ?? ''}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, from: e.target.value || undefined }))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">To Date</label>
            <input
              type="date"
              value={draftFilters.to ?? ''}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, to: e.target.value || undefined }))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={handleApplyFilters} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />Apply
          </Button>
          <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
        </div>
      </Card>

      {/* Table */}
      <div className="mt-5">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </Card>
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <ScrollText className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">No audit entries found</p>
              <p className="mt-1 text-sm text-gray-400">
                {Object.keys(filters).length > 0 ? 'Try adjusting your filters.' : 'Actions will appear here as users interact with the platform.'}
              </p>
            </div>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className={`border-b border-gray-50 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-[#0f1f3d]/5 px-2 py-0.5 text-xs font-mono font-medium text-[#0f1f3d]">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700">{entry.actor_email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${resourceTypeColor[entry.resource_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {entry.resource_type}
                      </span>
                      <span className="ml-1.5 text-xs text-gray-400">{entry.resource_id.slice(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{entry.ip_address ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  )
}
