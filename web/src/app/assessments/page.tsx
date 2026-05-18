'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { listAssessments, type Assessment } from '@/lib/api/assessments'
import { ClipboardList } from 'lucide-react'

const statusVariant = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'in_review') return 'warning'
  return 'default'
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f1f3d]/6">
        <ClipboardList className="h-8 w-8 text-[#0f1f3d]/40" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">No assessments yet</p>
        <p className="mt-1 text-sm text-gray-400">
          Open an AI system and start an assessment from its detail page to track compliance.
        </p>
      </div>
      <a
        href="/ai-systems"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0f1f3d] underline underline-offset-4 hover:opacity-70"
      >
        View AI Systems →
      </a>
    </div>
  )
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAssessments().then(setAssessments).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <p className="mt-0.5 text-sm text-gray-500">Track compliance assessments across your AI systems</p>
      </div>

      {loading && (
        <div className="mt-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && assessments.length === 0 && <EmptyState />}

      {!loading && assessments.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Assessment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assessments.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a href={`/assessments/${a.id}`} className="font-mono text-xs font-medium text-[#0f1f3d] hover:underline">
                      {a.id.slice(0, 8)}…
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/ai-systems/${a.asset_id}`} className="font-mono text-xs text-gray-500 hover:text-[#0f1f3d]">
                      {a.asset_id.slice(0, 8)}…
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(a.status)}>
                      {a.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
