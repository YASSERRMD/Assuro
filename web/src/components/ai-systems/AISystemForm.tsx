'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { registerAISystem } from '@/lib/api/aisystems'

interface AISystemFormProps {
  onSuccess?: () => void
}

const MODALITIES = ['text', 'image', 'audio', 'video', 'tabular', 'multimodal', 'other']
const DEPLOYMENT_CONTEXTS = ['cloud', 'on-premise', 'edge', 'hybrid', 'saas']
const LIFECYCLE_STAGES = ['development', 'testing', 'staging', 'production', 'deprecated']
const LIFECYCLE_STATUSES = ['active', 'inactive', 'retired', 'under_review']

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  )
}

function CheckboxField({ label, checked, onChange, description }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#0f1f3d]" />
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      </div>
    </label>
  )
}

export function AISystemForm({ onSuccess }: AISystemFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', provider: '', intended_purpose: '', description: '',
    modality: '', model_family: '', deployment_context: '',
    lifecycle_status: '', lifecycle_stage: '', autonomy_level: '0',
    eu_market_exposure: false, is_agentic: false,
  })

  const set = (key: keyof typeof form) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await registerAISystem({ ...form, autonomy_level: parseInt(form.autonomy_level, 10) || 0 })
      toast('AI system registered successfully.', 'success')
      onSuccess?.()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="System Name" value={form.name} onChange={(e) => set('name')(e.target.value)}
              placeholder="e.g. Credit Scoring Model v3" required />
          </div>
          <Input label="Provider / Vendor" value={form.provider} onChange={(e) => set('provider')(e.target.value)}
            placeholder="e.g. In-house / OpenAI" />
          <Input label="Model Family" value={form.model_family} onChange={(e) => set('model_family')(e.target.value)}
            placeholder="e.g. GPT-4, LLaMA, custom" />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Intended Purpose <span className="text-red-500">*</span></label>
            <textarea value={form.intended_purpose} onChange={(e) => set('intended_purpose')(e.target.value)}
              placeholder="Describe what this AI system is designed to do…" rows={2} required
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Description</label>
            <textarea value={form.description} onChange={(e) => set('description')(e.target.value)}
              placeholder="Additional context…" rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Technical Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Modality" value={form.modality} onChange={set('modality')} options={MODALITIES} />
          <SelectField label="Deployment Context" value={form.deployment_context} onChange={set('deployment_context')} options={DEPLOYMENT_CONTEXTS} />
          <SelectField label="Lifecycle Status" value={form.lifecycle_status} onChange={set('lifecycle_status')} options={LIFECYCLE_STATUSES} required />
          <SelectField label="Lifecycle Stage" value={form.lifecycle_stage} onChange={set('lifecycle_stage')} options={LIFECYCLE_STAGES} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Autonomy Level (0–5)</label>
            <input type="number" min={0} max={5} value={form.autonomy_level}
              onChange={(e) => set('autonomy_level')(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
            <p className="text-xs text-gray-400">0 = fully supervised · 5 = fully autonomous</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Governance Flags</h3>
        <div className="space-y-2">
          <CheckboxField label="EU Market Exposure" checked={form.eu_market_exposure} onChange={set('eu_market_exposure')}
            description="This system is deployed to or affects users in the European Union" />
          <CheckboxField label="Agentic Behavior" checked={form.is_agentic} onChange={set('is_agentic')}
            description="This system can take autonomous actions or control other systems" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Registering…' : 'Register AI System'}</Button>
      </div>
    </form>
  )
}
