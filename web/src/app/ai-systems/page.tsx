'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/risk/RiskBadge'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { listAISystems, type AISystem } from '@/lib/api/aisystems'
import { Plus, Cpu } from 'lucide-react'

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f1f3d]/6">
        <Cpu className="h-8 w-8 text-[#0f1f3d]/40" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">No AI systems yet</p>
        <p className="mt-1 text-sm text-gray-400">Register your first AI system to start tracking governance and risk.</p>
      </div>
      <a href="/ai-systems/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Register AI System
        </Button>
      </a>
    </div>
  )
}

export default function AISystemsPage() {
  const [systems, setSystems] = useState<AISystem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAISystems().then(setSystems).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Systems</h1>
          <p className="mt-0.5 text-sm text-gray-500">Inventory of AI systems under governance</p>
        </div>
        <a href="/ai-systems/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Register
          </Button>
        </a>
      </div>

      {loading && (
        <div className="mt-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && systems.length === 0 && <EmptyState />}

      {!loading && systems.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Risk Tier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {systems.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <a href={`/ai-systems/${s.id}`} className="text-[#0f1f3d] hover:underline">
                      {s.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.provider || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3"><RiskBadge tier={s.latest_risk_tier} /></td>
                  <td className="px-4 py-3 capitalize text-gray-500">{s.lifecycle_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
