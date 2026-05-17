'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/risk/RiskBadge'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'

export default function AISystemsPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAISystems().then(setSystems).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">AI Systems</h1>
        <a href="/ai-systems/new"><Button>Register</Button></a>
      </div>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}

      {!loading && systems.length === 0 && (
        <p className="mt-4 text-gray-500">No AI systems registered yet.</p>
      )}

      {!loading && systems.length > 0 && (
        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-sm font-medium text-navy">Name</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Provider</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Risk</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Status</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="py-2"><a href={`/ai-systems/${s.id}`} className="text-navy underline">{s.name}</a></td>
                <td className="py-2 text-sm">{s.provider || '-'}</td>
                <td className="py-2"><RiskBadge tier={s.latest_risk_tier} /></td>
                <td className="py-2 text-sm capitalize">{s.lifecycle_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}
