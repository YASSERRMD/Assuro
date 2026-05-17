'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { listAssessments, type Assessment } from '@/lib/api/assessments'

const statusVariant = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'in_review') return 'warning'
  return 'default'
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAssessments().then(setAssessments).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Assessments</h1>
      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {!loading && assessments.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No assessments yet. Open an AI system and start an assessment from its detail page.</p>
      )}
      {!loading && assessments.length > 0 && (
        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-sm font-medium text-navy">Assessment ID</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Asset ID</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Status</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Created</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Completed</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id} className="border-b border-gray-100">
                <td className="py-2">
                  <a href={`/assessments/${a.id}`} className="font-mono text-xs text-navy underline">
                    {a.id.slice(0, 8)}…
                  </a>
                </td>
                <td className="py-2">
                  <a href={`/ai-systems/${a.asset_id}`} className="font-mono text-xs text-gray-500 hover:text-navy">
                    {a.asset_id.slice(0, 8)}…
                  </a>
                </td>
                <td className="py-2">
                  <Badge variant={statusVariant(a.status)}>
                    {a.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="py-2 text-sm">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="py-2 text-sm text-gray-500">
                  {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}
