'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listAgents, createAgent, killAgent, type Agent } from '@/lib/api/agents'
import { Bot, Plus, X, Zap } from 'lucide-react'

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  active: { dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', label: 'Online' },
  running: { dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', label: 'Running' },
  idle: { dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700', label: 'Idle' },
  error: { dot: 'bg-red-400', badge: 'bg-red-100 text-red-700', label: 'Error' },
  killed: { dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', label: 'Killed' },
  suspended: { dot: 'bg-red-300', badge: 'bg-red-50 text-red-500', label: 'Suspended' },
}

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', label: status }
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Register Agent</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Agent Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
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
              {submitting ? 'Registering...' : 'Register'}
            </button>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="page-subtitle">Monitor and manage AI agents</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />Register Agent
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="shimmer h-5 rounded w-40" />
              <div className="shimmer h-4 rounded w-full" />
              <div className="shimmer h-5 rounded-full w-16" />
            </div>
          ))}
        </div>
      )}

      {!loading && agents.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Bot className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No agents registered</p>
          <p className="empty-body">Register your first AI agent to start monitoring it.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Register Agent
          </button>
        </div>
      )}

      {!loading && agents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {agents.map((agent) => {
            const sc = getStatusConfig(agent.status)
            return (
              <div key={agent.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B2A4A]/6">
                      <Bot className="h-4 w-4 text-[#1B2A4A]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{agent.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>

                {agent.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{agent.description}</p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-auto">
                  <span className="text-xs text-gray-400">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </span>
                  {agent.status !== 'killed' && (
                    <button
                      onClick={() => handleKill(agent.id)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      <Zap className="h-3 w-3" />
                      Kill Switch
                    </button>
                  )}
                </div>
              </div>
            )
          })}
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
