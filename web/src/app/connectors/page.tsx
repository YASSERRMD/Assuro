'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listConnectors, createConnector, triggerConnectorSync, deleteConnector, type Connector } from '@/lib/api/connectors'
import { Plug, Plus, X, RefreshCw, Trash2 } from 'lucide-react'

const connectorTypes = ['github', 'jira', 'slack', 'datadog', 'splunk', 'aws', 'azure', 'gcp', 'huggingface', 'custom']

const statusDot: Record<string, string> = {
  active: 'bg-emerald-400',
  connected: 'bg-emerald-400',
  inactive: 'bg-gray-300',
  error: 'bg-red-400',
  failed: 'bg-red-400',
  syncing: 'bg-blue-400',
}

const typeBadge: Record<string, string> = {
  github: 'bg-gray-900 text-white',
  jira: 'bg-blue-600 text-white',
  slack: 'bg-purple-600 text-white',
  datadog: 'bg-orange-500 text-white',
  splunk: 'bg-gray-700 text-white',
  aws: 'bg-orange-400 text-white',
  azure: 'bg-blue-500 text-white',
  gcp: 'bg-red-500 text-white',
  huggingface: 'bg-amber-500 text-white',
  custom: 'bg-gray-200 text-gray-700',
}

function AddConnectorModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (c: Connector) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [connectorType, setConnectorType] = useState('github')
  const [apiKey, setApiKey] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const connector = await createConnector({
        name,
        connector_type: connectorType,
        status: 'active',
        config: apiKey ? { api_key: apiKey } : {},
      })
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add Connector</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Connector Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Connector display name"
              required
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value)}
              className="input-base"
            >
              {connectorTypes.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">API Key / Token (optional)</label>
            <input
              className="input-base"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
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
              {submitting ? 'Adding...' : 'Add Connector'}
            </button>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Connectors</h1>
          <p className="page-subtitle">Integrate external tools and data sources</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />Add Connector
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="shimmer h-5 rounded w-40" />
              <div className="shimmer h-5 rounded-full w-16" />
              <div className="shimmer h-4 rounded w-full" />
              <div className="shimmer h-8 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && connectors.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Plug className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No connectors configured</p>
          <p className="empty-body">Add integrations to pull data from external sources.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Add Connector
          </button>
        </div>
      )}

      {!loading && connectors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {connectors.map((connector) => (
            <div key={connector.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                    <Plug className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{connector.name}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadge[connector.connector_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {connector.connector_type}
                    </span>
                  </div>
                </div>
                {/* Status dot */}
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusDot[connector.status] ?? 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-500 capitalize">{connector.status}</span>
                </div>
              </div>

              {connector.last_synced_at && (
                <p className="text-xs text-gray-400">
                  Last sync: {new Date(connector.last_synced_at).toLocaleString()}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
                <button
                  onClick={() => handleSync(connector.id)}
                  disabled={syncingId === connector.id}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 border border-blue-100"
                >
                  <RefreshCw className={`h-3 w-3 ${syncingId === connector.id ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
                <button
                  onClick={() => handleDelete(connector.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg py-1.5 px-3 text-xs font-medium text-red-500 hover:bg-red-50 transition border border-red-100"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <AddConnectorModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setConnectors((prev) => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
