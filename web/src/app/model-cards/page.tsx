'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listModelCards, createModelCard, publishModelCard, type ModelCard } from '@/lib/api/modelcards'
import { BookMarked, Plus, X, Send } from 'lucide-react'

function CreateModelCardModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (c: ModelCard) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [intendedUse, setIntendedUse] = useState('')
  const [limitations, setLimitations] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const card = await createModelCard({
        title, description, intended_use: intendedUse,
        limitations, status: 'draft', version: '1.0', published: false,
        out_of_scope_use: '', training_data: '', evaluation_results: '',
      })
      toast('Model card created.', 'success')
      onCreated(card)
    } catch {
      toast('Failed to create model card.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Model Card</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Model name or identifier" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the model..." rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Intended Use</label>
            <textarea value={intendedUse} onChange={(e) => setIntendedUse(e.target.value)}
              placeholder="What is the model designed for?" rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Limitations</label>
            <textarea value={limitations} onChange={(e) => setLimitations(e.target.value)}
              placeholder="Known limitations and risks..." rows={2}
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

export default function ModelCardsPage() {
  const { toast } = useToast()
  const [cards, setCards] = useState<ModelCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    listModelCards()
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [])

  const handlePublish = async (id: string): Promise<void> => {
    try {
      const updated = await publishModelCard(id)
      setCards((prev) => prev.map((c) => c.id === id ? updated : c))
      toast('Model card published.', 'success')
    } catch {
      toast('Failed to publish model card.', 'error')
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Cards</h1>
          <p className="mt-0.5 text-sm text-gray-500">Document AI model capabilities, limitations, and intended use</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Model Card
        </Button>
      </div>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <BookMarked className="h-8 w-8 text-amber-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No model cards yet</p>
            <p className="mt-1 text-sm text-gray-400">Create model cards to document your AI models.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Create Model Card
          </Button>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <BookMarked className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{card.title}</p>
                    <Badge variant="outline" className="text-[10px]">v{card.version}</Badge>
                  </div>
                </div>
                <Badge variant={card.published ? 'success' : 'warning'}>
                  {card.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              {card.description && (
                <p className="text-xs text-gray-500 line-clamp-3">{card.description}</p>
              )}
              {card.intended_use && (
                <div className="rounded-md bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Intended Use</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{card.intended_use}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{new Date(card.created_at).toLocaleDateString()}</span>
                {!card.published && (
                  <button
                    onClick={() => handlePublish(card.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Send className="h-3 w-3" />
                    Publish
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModelCardModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setCards((prev) => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
