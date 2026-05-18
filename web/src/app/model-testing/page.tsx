'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listTestSuites, createTestSuite, createTestRun, type TestSuite } from '@/lib/api/testing'
import { TestTube2, Plus, X, Play, CheckCircle, XCircle } from 'lucide-react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'passed') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'info'
  return 'default'
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Test Suite</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Suite Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Bias Detection Suite" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this test suite verify?" rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create Suite'}</Button>
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

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Testing</h1>
          <p className="mt-0.5 text-sm text-gray-500">Define and run test suites for AI model evaluation</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Test Suite
        </Button>
      </div>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && suites.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50">
            <TestTube2 className="h-8 w-8 text-cyan-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No test suites yet</p>
            <p className="mt-1 text-sm text-gray-400">Create test suites to validate AI model behaviour.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Create Test Suite
          </Button>
        </div>
      )}

      {!loading && suites.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {suites.map((suite) => (
            <Card key={suite.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50">
                    <TestTube2 className="h-4 w-4 text-cyan-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{suite.name}</p>
                </div>
                <Badge variant={statusVariant(suite.status)} className="capitalize">{suite.status}</Badge>
              </div>
              {suite.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{suite.description}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{new Date(suite.created_at).toLocaleDateString()}</span>
                <button
                  onClick={() => handleRun(suite.id)}
                  disabled={runningId === suite.id || suite.status === 'running'}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  {suite.status === 'running' ? 'Running...' : 'Run'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary counts */}
      {!loading && suites.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Suites', value: suites.length, icon: TestTube2, color: 'text-cyan-600 bg-cyan-50' },
            { label: 'Passed', value: suites.filter((s) => s.status === 'passed').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Failed', value: suites.filter((s) => s.status === 'failed').length, icon: XCircle, color: 'text-red-600 bg-red-50' },
          ].map((stat) => (
            <Card key={stat.label} className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </Card>
          ))}
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
