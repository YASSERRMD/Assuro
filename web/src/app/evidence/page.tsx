'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { listEvidence, type Evidence } from '@/lib/api/evidence'

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listEvidence().then(setEvidence).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Evidence Library</h1>
      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {!loading && evidence.length === 0 && <p className="mt-4 text-gray-500">No evidence uploaded.</p>}
      {!loading && evidence.length > 0 && (
        <table className="mt-4 w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-sm font-medium text-navy">Title</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Hash</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Date</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((e) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="py-2">{e.title}</td>
                <td className="py-2 font-mono text-xs">{e.content_hash.slice(0, 12)}...</td>
                <td className="py-2 text-sm">{new Date(e.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}
