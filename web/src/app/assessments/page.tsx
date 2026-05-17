'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { listAssessments, type Assessment } from '@/lib/api/assessments'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-300',
  in_review: 'bg-yellow-400',
  completed: 'bg-green-500 text-white',
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
      {!loading && assessments.length === 0 && <p className="mt-4 text-gray-500">No assessments yet.</p>}
      {!loading && assessments.length > 0 && (
        <table className="mt-4 w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-sm font-medium text-navy">ID</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Status</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Created</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id} className="border-b border-gray-100">
                <td className="py-2"><a href={`/assessments/${a.id}`} className="text-navy underline">{a.id.slice(0, 8)}</a></td>
                <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[a.status] || 'bg-gray-200'}`}>{a.status}</span></td>
                <td className="py-2 text-sm">{new Date(a.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}
