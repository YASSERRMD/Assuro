'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { listFrameworks, listControls, type Framework, type Control } from '@/lib/api/frameworks'

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [controls, setControls] = useState<Control[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listFrameworks(), listControls()])
      .then(([fws, ctrls]) => {
        setFrameworks(fws)
        setControls(ctrls)
        if (fws.length > 0) setSelected(fws[0].key)
      })
      .finally(() => setLoading(false))
  }, [])

  const frameworkControls = controls.filter((c) => {
    if (!selected) return false
    return c.key.startsWith(selected.toLowerCase().replace(/ /g, '_').split('_')[0]) ||
           c.domain.toLowerCase().includes(selected.toLowerCase().split(' ')[0].toLowerCase())
  })

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Frameworks</h1>
      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {!loading && (
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              onClick={() => setSelected(fw.key)}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                selected === fw.key
                  ? 'border-navy bg-navy/5'
                  : 'border-gray-200 bg-white hover:border-navy/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-navy">{fw.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{fw.key}</p>
                </div>
                <Badge variant="info">{fw.version}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6">
          <h2 className="text-lg font-medium text-navy">Controls</h2>
          {frameworkControls.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No controls loaded for this framework yet.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Key</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {frameworkControls.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{c.key}</td>
                      <td className="px-4 py-2 text-sm">{c.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{c.domain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && frameworks.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No frameworks registered. Run database seeding to add EU AI Act, NIST AI RMF, and ISO 42001.</p>
      )}
    </Shell>
  )
}
