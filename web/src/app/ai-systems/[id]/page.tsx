'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { RiskBadge } from '@/components/risk/RiskBadge'
import { getAISystem, computeRisk, getRisk, getRiskHistory, type AISystem, type RiskAssessment } from '@/lib/api/aisystems'

export default function AISystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [system, setSystem] = useState<AISystem | null>(null)
  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(async (p) => {
      const [sys, r] = await Promise.all([getAISystem(p.id), getRisk(p.id)])
      setSystem(sys)
      setRisk(r)
      setLoading(false)
    })
  }, [params])

  const handleCompute = async (): Promise<void> => {
    params.then(async (p) => {
      const r = await computeRisk(p.id)
      setRisk(r)
    })
  }

  if (loading) return <Shell><p>Loading...</p></Shell>
  if (!system) return <Shell><p>Not found</p></Shell>

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">{system.name}</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="font-medium">Details</h2>
          <p className="text-sm">Provider: {system.provider || '-'}</p>
          <p className="text-sm">Purpose: {system.intended_purpose || '-'}</p>
          <p className="text-sm">Modality: {system.modality || '-'}</p>
          <p className="text-sm">EU Exposure: {system.eu_market_exposure ? 'Yes' : 'No'}</p>
          <p className="text-sm">Agentic: {system.is_agentic ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <h2 className="font-medium">Risk</h2>
          {risk ? (
            <div>
              <RiskBadge tier={risk.tier} />
              <p className="mt-2 text-sm">Score: {risk.score}/100</p>
              {risk.factors.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-sm">
                  {risk.factors.map((f) => <li key={f.code}><strong>{f.code}</strong>: {f.description}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No risk assessment yet.</p>
          )}
          <button onClick={handleCompute} className="mt-2 text-sm text-navy underline">Compute risk</button>
        </div>
      </div>
    </Shell>
  )
}
