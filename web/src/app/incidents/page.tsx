'use client'

import { Shell } from '@/components/shell/Shell'

const mockIncidents = [
  { id: '1', title: 'Model drift detected', severity: 'high', status: 'open' },
  { id: '2', title: 'Bias in predictions', severity: 'medium', status: 'investigating' },
  { id: '3', title: 'Policy violation', severity: 'low', status: 'mitigated' },
]

const columns = ['open', 'investigating', 'mitigated', 'closed']

export default function IncidentsPage() {
  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Incidents</h1>
      <div className="mt-4 grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col} className="rounded-lg bg-gray-50 p-3">
            <h2 className="mb-2 text-sm font-medium capitalize text-navy">{col}</h2>
            {mockIncidents.filter((i) => i.status === col).map((i) => (
              <div key={i.id} className="mb-2 rounded bg-white p-2 shadow-sm">
                <p className="text-sm font-medium">{i.title}</p>
                <span className={`text-xs ${i.severity === 'high' ? 'text-red-600' : i.severity === 'medium' ? 'text-orange-500' : 'text-gray-500'}`}>
                  {i.severity}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  )
}
