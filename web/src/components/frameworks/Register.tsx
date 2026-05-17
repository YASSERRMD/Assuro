'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Gauge } from '@/components/charts/Gauge'
import { listControls, getCoverage, setControlStatus, getSoA, type Control, type Coverage, type ControlStatus } from '@/lib/api/frameworks'

export default function FrameworkRegisterPage() {
  const [controls, setControls] = useState<Control[]>([])
  const [coverage, setCoverage] = useState<Coverage[]>([])
  const [statuses, setStatuses] = useState<ControlStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listControls(), getCoverage('demo-asset'), getSoA('demo-asset')])
      .then(([c, cov, s]) => { setControls(c); setCoverage(cov); setStatuses(s) })
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (controlId: string, status: string): Promise<void> => {
    await setControlStatus('demo-asset', controlId, status, '')
    const newCov = await getCoverage('demo-asset')
    setCoverage(newCov)
  }

  if (loading) return <Shell><p>Loading...</p></Shell>

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Cross-Framework Register</h1>
      <div className="mt-4 flex gap-6">
        {coverage.map((c) => <Gauge key={c.framework_key} label={c.framework_key} pct={c.coverage_pct} />)}
      </div>
      <table className="mt-6 w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 text-left text-sm font-medium text-navy">Control</th>
            <th className="py-2 text-left text-sm font-medium text-navy">Status</th>
          </tr>
        </thead>
        <tbody>
          {controls.map((c) => {
            const s = statuses.find((x) => x.control_key === c.key)
            return (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="py-2">{c.title}</td>
                <td className="py-2">
                  <select className="rounded border border-gray-300 px-2 py-1 text-sm"
                    value={s?.status || 'not_started'}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="implemented">Implemented</option>
                    <option value="not_applicable">N/A</option>
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Shell>
  )
}
