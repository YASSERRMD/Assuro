'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listGuardrails, createGuardrail, updateGuardrail, type Guardrail } from '@/lib/api/agents'
import { Shield, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react'

function CreateGuardrailModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (g: Guardrail) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ruleType, setRuleType] = useState('content_filter')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const g = await createGuardrail({ name, description, rule_type: ruleType, enabled: true, config: {} })
      toast('Guardrail created.', 'success')
      onCreated(g)
    } catch {
      toast('Failed to create guardrail.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Guardrail</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Guardrail name" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Rule Type</label>
            <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
              {['content_filter', 'rate_limit', 'data_validation', 'output_check', 'access_control'].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this guardrail protect?" rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GuardrailsPage() {
  const { toast } = useToast()
  const [guardrails, setGuardrails] = useState<Guardrail[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    listGuardrails()
      .then(setGuardrails)
      .catch(() => setGuardrails([]))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (g: Guardrail): Promise<void> => {
    try {
      const updated = await updateGuardrail(g.id, { enabled: !g.enabled })
      setGuardrails((prev) => prev.map((item) => item.id === g.id ? updated : item))
      toast(`Guardrail ${updated.enabled ? 'enabled' : 'disabled'}.`, 'success')
    } catch {
      toast('Failed to update guardrail.', 'error')
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guardrails</h1>
          <p className="mt-0.5 text-sm text-gray-500">Configure safety constraints for AI systems</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Guardrail
        </Button>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </Card>
          ))}
        </div>
      )}

      {!loading && guardrails.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Shield className="h-8 w-8 text-emerald-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No guardrails defined</p>
            <p className="mt-1 text-sm text-gray-400">Create your first guardrail to protect AI system outputs.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Create Guardrail
          </Button>
        </div>
      )}

      {!loading && guardrails.length > 0 && (
        <div className="mt-6 space-y-3">
          {guardrails.map((g) => (
            <Card key={g.id} className="flex items-center gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d]/5">
                <Shield className="h-4 w-4 text-[#0f1f3d]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{g.name}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{g.rule_type.replace(/_/g, ' ')}</Badge>
                </div>
                {g.description && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">{g.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={g.enabled ? 'success' : 'default'}>{g.enabled ? 'Enabled' : 'Disabled'}</Badge>
                <button
                  onClick={() => handleToggle(g)}
                  className="text-gray-400 hover:text-[#0f1f3d] transition"
                  title={g.enabled ? 'Disable' : 'Enable'}
                >
                  {g.enabled
                    ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                    : <ToggleLeft className="h-5 w-5" />
                  }
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGuardrailModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { setGuardrails((prev) => [g, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
