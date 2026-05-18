'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listTestSuites, createTestSuite, createTestRun, type TestSuite } from '@/lib/api/testing'
import { TestTube2, Plus, X, Play, CheckCircle, XCircle } from 'lucide-react'

const statusBadge: Record<string, string> = {
  passed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  idle: 'bg-gray-100 text-gray-500',
}

function CreateSuiteModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (s: TestSuite) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const suite = await createTestSuite({ name, description, status: 'idle' })
      toast('Test suite created.', 'success')
      onCreated(suite)
    } catch {
      toast('Failed to create test suite.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Test Suite</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Suite Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bias Detection Suite"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this test suite verify?"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Suite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ModelTestingPage() {
  const { toast } = useToast()
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)

  useEffect(() => {
    listTestSuites()
      .then(setSuites)
      .catch(() => setSuites([]))
      .finally(() => setLoading(false))
  }, [])

  const handleRun = async (suiteId: string): Promise<void> => {
    setRunningId(suiteId)
    try {
      await createTestRun(suiteId)
      toast('Test run started.', 'success')
      setSuites((prev) => prev.map((s) => s.id === suiteId ? { ...s, status: 'running' } : s))
    } catch {
      toast('Failed to start test run.', 'error')
    } finally {
      setRunningId(null)
    }
  }

  const totalSuites = suites.length
  const passing = suites.filter((s) => s.status === 'passed').length
  const failing = suites.filter((s) => s.status === 'failed').length
  const avgScore = totalSuites > 0
    ? Math.round((passing / totalSuites) * 100)
    : 0

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Model Testing</h1>
          <p className="page-subtitle">Define and run test suites for AI model evaluation</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />Create Suite
        </button>
      </div>

      {/* Stats row */}
      {!loading && suites.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in">
          {[
            { label: 'Total Suites', value: totalSuites, icon: TestTube2, color: 'bg-[#1B2A4A]/6 text-[#1B2A4A]' },
            { label: 'Passing', value: passing, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Failing', value: failing, icon: XCircle, color: 'bg-red-50 text-red-600' },
            { label: 'Pass Rate', value: `${avgScore}%`, icon: TestTube2, color: 'bg-blue-50 text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-40" />
                <div className="shimmer h-5 rounded-full w-16 ml-auto" />
                <div className="shimmer h-5 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && suites.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <TestTube2 className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No test suites yet</p>
          <p className="empty-body">Create test suites to validate AI model behaviour.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Create Test Suite
          </button>
        </div>
      )}

      {!loading && suites.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Suite Name</th>
                <th>Test Cases</th>
                <th>Last Run</th>
                <th>Pass Rate</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suites.map((suite) => {
                const passRate = suite.status === 'passed' ? '100%' : suite.status === 'failed' ? '0%' : '-'
                return (
                  <tr key={suite.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-50">
                          <TestTube2 className="h-3.5 w-3.5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{suite.name}</p>
                          {suite.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{suite.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-500">
                      {(suite.test_cases_count ?? 0)} cases
                    </td>
                    <td className="text-xs text-gray-400">
                      {new Date(suite.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-sm font-semibold text-gray-700">{passRate}</td>
                    <td>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[suite.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {suite.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleRun(suite.id)}
                        disabled={runningId === suite.id || suite.status === 'running'}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                      >
                        <Play className="h-3 w-3" />
                        {suite.status === 'running' ? 'Running...' : 'Run'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateSuiteModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => { setSuites((prev) => [s, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
