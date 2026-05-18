'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listConnectors, createConnector, triggerConnectorSync, deleteConnector, type Connector } from '@/lib/api/connectors'
import { Plug, Plus, X, RefreshCw, Trash2 } from 'lucide-react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'active' || status === 'connected') return 'success'
  if (status === 'error' || status === 'failed') return 'danger'
  if (status === 'syncing') return 'info'
  return 'default'
}

const connectorTypes = ['github', 'jira', 'slack', 'datadog', 'splunk', 'aws', 'azure', 'gcp', 'custom']

function CreateConnectorModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (c: Connector) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [connectorType, setConnectorType] = useState('github')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const connector = await createConnector({ name, connector_type: connectorType, status: 'active', config: {} })
      toast('Connector created.', 'success')
      onCreated(connector)
    } catch {
      toast('Failed to create connector.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add Connector</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Connector display name" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Type</label>
            <select value={connectorType} onChange={(e) => setConnectorType(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
              {connectorTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Connector'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ConnectorsPage() {
  const { toast } = useToast()
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    listConnectors()
      .then(setConnectors)
      .catch(() => setConnectors([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async (id: string): Promise<void> => {
    setSyncingId(id)
    try {
      await triggerConnectorSync(id)
      toast('Sync triggered.', 'success')
      setConnectors((prev) => prev.map((c) => c.id === id ? { ...c, status: 'syncing' } : c))
    } catch {
      toast('Failed to trigger sync.', 'error')
    } finally {
      setSyncingId(null)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this connector?')) return
    try {
      await deleteConnector(id)
      setConnectors((prev) => prev.filter((c) => c.id !== id))
      toast('Connector deleted.', 'success')
    } catch {
      toast('Failed to delete connector.', 'error')
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connectors</h1>
          <p className="mt-0.5 text-sm text-gray-500">Integrate external tools and data sources</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Connector
        </Button>
      </div>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </Card>
          ))}
        </div>
      )}

      {!loading && connectors.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <Plug className="h-8 w-8 text-orange-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No connectors configured</p>
            <p className="mt-1 text-sm text-gray-400">Add integrations to pull data from external sources.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Connector
          </Button>
        </div>
      )}

      {!loading && connectors.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connectors.map((connector) => (
            <Card key={connector.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                    <Plug className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{connector.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase mt-0.5">{connector.connector_type}</Badge>
                  </div>
                </div>
                <Badge variant={statusVariant(connector.status)} className="capitalize">{connector.status}</Badge>
              </div>
              {connector.last_synced_at && (
                <p className="text-xs text-gray-400">Last synced: {new Date(connector.last_synced_at).toLocaleString()}</p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <button
                  onClick={() => handleSync(connector.id)}
                  disabled={syncingId === connector.id}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md px-2 py-1 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${syncingId === connector.id ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button
                  onClick={() => handleDelete(connector.id)}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md px-2 py-1 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateConnectorModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setConnectors((prev) => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
