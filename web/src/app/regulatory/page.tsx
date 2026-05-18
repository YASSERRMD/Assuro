'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  listRegulatoryChanges,
  createRegulatoryChange,
  listRegulatoryImpacts,
  type RegulatoryChange,
  type RegulatoryImpact,
} from '@/lib/api/regulatory'
import { Scale, Plus, X, Globe } from 'lucide-react'

type Tab = 'changes' | 'impacts'
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'active' || status === 'in_force') return 'danger'
  if (status === 'upcoming' || status === 'pending') return 'warning'
  if (status === 'superseded' || status === 'revoked') return 'default'
  return 'info'
}

const impactVariant = (severity: string): BadgeVariant => {
  if (severity === 'high' || severity === 'critical') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'default'
}

function CreateChangeModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (c: RegulatoryChange) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [jurisdiction, setJurisdiction] = useState('EU')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const change = await createRegulatoryChange({ title, source, jurisdiction, description, status: 'upcoming' })
      toast('Regulatory change added.', 'success')
      onCreated(change)
    } catch {
      toast('Failed to add change.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add Regulatory Change</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g. EU AI Act Article 13" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="EUAIA, NIST..." />
            <Input label="Jurisdiction" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="EU, US, UK..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of the regulatory change..." rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegulatoryPage() {
  const [changes, setChanges] = useState<RegulatoryChange[]>([])
  const [impacts, setImpacts] = useState<RegulatoryImpact[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<Tab>('changes')

  useEffect(() => {
    Promise.all([
      listRegulatoryChanges().catch(() => [] as RegulatoryChange[]),
      listRegulatoryImpacts().catch(() => [] as RegulatoryImpact[]),
    ]).then(([c, i]) => { setChanges(c); setImpacts(i) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regulatory Intelligence</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track regulatory changes and their impact on AI systems</p>
        </div>
        {tab === 'changes' && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Change
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-gray-200">
        {(['changes', 'impacts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-4 text-sm font-medium transition border-b-2 -mb-px capitalize ${
              tab === t ? 'border-[#0f1f3d] text-[#0f1f3d]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'changes' ? 'Regulatory Changes' : 'Impact Assessments'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-5 w-64 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        )}

        {tab === 'changes' && !loading && (
          <>
            {changes.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                  <Scale className="h-8 w-8 text-teal-200" />
                </div>
                <p className="text-base font-semibold text-gray-700">No regulatory changes tracked</p>
                <p className="text-sm text-gray-400">Add regulatory changes that may affect your AI systems.</p>
                <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="h-4 w-4" />Add Change
                </Button>
              </div>
            )}
            {changes.length > 0 && (
              <div className="space-y-3">
                {changes.map((change) => (
                  <Card key={change.id} className="flex items-start gap-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 mt-0.5">
                      <Scale className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{change.title}</p>
                        <Badge variant={statusVariant(change.status)} className="capitalize">
                          {change.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {change.description && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{change.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-3">
                        {change.source && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Globe className="h-3 w-3" />{change.source}
                          </span>
                        )}
                        {change.jurisdiction && (
                          <Badge variant="outline" className="text-[10px]">{change.jurisdiction}</Badge>
                        )}
                        {change.effective_date && (
                          <span className="text-xs text-gray-400">
                            Effective: {new Date(change.effective_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'impacts' && !loading && (
          <>
            {impacts.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                  <Scale className="h-8 w-8 text-teal-200" />
                </div>
                <p className="text-base font-semibold text-gray-700">No impact assessments</p>
                <p className="text-sm text-gray-400">Impact assessments link regulatory changes to specific AI systems.</p>
              </div>
            )}
            {impacts.length > 0 && (
              <div className="space-y-3">
                {impacts.map((impact) => (
                  <Card key={impact.id} className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{impact.description}</p>
                        <Badge variant={impactVariant(impact.severity)} className="capitalize">{impact.severity}</Badge>
                        <Badge variant={impact.status === 'resolved' ? 'success' : 'warning'} className="capitalize">
                          {impact.status}
                        </Badge>
                      </div>
                      {impact.notes && (
                        <p className="mt-1 text-xs text-gray-400">{impact.notes}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateChangeModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setChanges((prev) => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
