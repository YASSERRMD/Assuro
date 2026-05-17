'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Gauge } from '@/components/charts/Gauge'

export default function DashboardPage() {
  const [coverages, setCoverages] = useState<Array<{ framework_key: string; coverage_pct: number }>>([])

  useEffect(() => {
    setCoverages([
      { framework_key: 'EU AI Act', coverage_pct: 62 },
      { framework_key: 'NIST AI RMF', coverage_pct: 45 },
      { framework_key: 'ISO 42001', coverage_pct: 38 },
    ])
  }, [])

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">AI Systems</p>
          <p className="text-3xl font-bold text-navy">8</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">High Risk</p>
          <p className="text-3xl font-bold text-orange-500">3</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Open Incidents</p>
          <p className="text-3xl font-bold text-red-600">2</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Completed Assessments</p>
          <p className="text-3xl font-bold text-green-600">5</p>
        </div>
      </div>
      <h2 className="mt-6 text-lg font-medium">Framework Coverage</h2>
      <div className="mt-4 flex gap-6">
        {coverages.map((c) => <Gauge key={c.framework_key} label={c.framework_key} pct={c.coverage_pct} />)}
      </div>
    </Shell>
  )
}
