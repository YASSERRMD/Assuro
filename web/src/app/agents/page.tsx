'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listAgents, createAgent, killAgent, type Agent } from '@/lib/api/agents'
import { Bot, Plus, X, Zap } from 'lucide-react'

const statusVariant = (status: string) => {
  if (status === 'active' || status === 'running') return 'success'
  if (status === 'error' || status === 'killed') return 'danger'
  if (status === 'idle') return 'info'
  return 'default'
}

function RegisterAgentModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (a: Agent) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const agent = await createAgent({ name, description, status: 'idle' })
      toast('Agent registered.', 'success')
      onCreated(agent)
    } catch {
      toast('Failed to register agent.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Register Agent</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Agent name" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?" rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Register'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    listAgents()
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false))
  }, [])

  const handleKill = async (id: string): Promise<void> => {
    try {
      await killAgent(id)
      setAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: 'killed' } : a))
      toast('Agent killed.', 'success')
    } catch {
      toast('Failed to kill agent.', 'error')
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage and monitor AI agents</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Register Agent
        </Button>
      </div>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-3 h-5 w-16 rounded-full" />
            </Card>
          ))}
        </div>
      )}

      {!loading && agents.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Bot className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No agents registered</p>
            <p className="mt-1 text-sm text-gray-400">Register your first AI agent to start monitoring it.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Register Agent
          </Button>
        </div>
      )}

      {!loading && agents.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f1f3d]/5">
                    <Bot className="h-4 w-4 text-[#0f1f3d]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <Badge variant={statusVariant(agent.status)} className="capitalize">{agent.status}</Badge>
              </div>
              {agent.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{agent.description}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{new Date(agent.created_at).toLocaleDateString()}</span>
                {agent.status !== 'killed' && (
                  <button
                    onClick={() => handleKill(agent.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <Zap className="h-3 w-3" />
                    Kill
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <RegisterAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={(a) => { setAgents((prev) => [a, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
