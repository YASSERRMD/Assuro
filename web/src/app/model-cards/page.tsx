'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listModelCards, createModelCard, publishModelCard, type ModelCard } from '@/lib/api/modelcards'
import { BookMarked, Plus, X, Send, Eye } from 'lucide-react'

const riskBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
}

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
        title,
        description,
        intended_use: intendedUse,
        limitations,
        status: 'draft',
        version: '1.0',
        published: false,
        out_of_scope_use: '',
        training_data: '',
        evaluation_results: '',
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Model Card</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Model name or identifier"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the model..."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div>
            <label className="label">Intended Use</label>
            <textarea
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              placeholder="What is the model designed for?"
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div>
            <label className="label">Limitations</label>
            <textarea
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="Known limitations and risks..."
              rows={2}
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
              {submitting ? 'Creating...' : 'Create'}
            </button>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Model Cards</h1>
          <p className="page-subtitle">Document AI model capabilities, limitations and intended use</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />New Model Card
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="shimmer h-5 rounded w-40" />
              <div className="shimmer h-4 rounded w-full" />
              <div className="shimmer h-4 rounded w-3/4" />
              <div className="flex gap-2">
                <div className="shimmer h-5 rounded-full w-16" />
                <div className="shimmer h-5 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <BookMarked className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No model cards yet</p>
          <p className="empty-body">Create model cards to document your AI models.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Create Model Card
          </button>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {cards.map((card) => (
            <div key={card.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                    <BookMarked className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{card.title}</h3>
                    <span className="font-mono text-[10px] text-gray-400">v{card.version}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${card.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {card.published ? 'Published' : 'Draft'}
                  </span>
                  {card.status && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${riskBadge[card.status] ?? 'bg-gray-100 text-gray-500'} capitalize`}>
                      {card.status}
                    </span>
                  )}
                </div>
              </div>

              {card.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{card.description}</p>
              )}

              {card.intended_use && (
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Intended Use</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{card.intended_use}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-50">
                <span className="text-xs text-gray-400">{new Date(card.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition">
                    <Eye className="h-3 w-3" />View
                  </button>
                  {!card.published && (
                    <button
                      onClick={() => handlePublish(card.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                    >
                      <Send className="h-3 w-3" />Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
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
