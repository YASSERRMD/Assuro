'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import {
  listNotifications,
  markNotificationRead,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  listAlertRules,
  createAlertRule,
  type Notification,
  type Webhook,
  type AlertRule,
} from '@/lib/api/notifications'
import { Bell, X, Plus, Trash2, CheckCheck, AlertTriangle, Info, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'

type Tab = 'notifications' | 'webhooks' | 'alert-rules'

const severityIcon: Record<string, React.ElementType> = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
}

const severityIconColor: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-blue-600 bg-blue-50',
}

function AddWebhookModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (w: Webhook) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const wh = await createWebhook({ name, url, events: [], active: true })
      toast('Webhook added.', 'success')
      onCreated(wh)
    } catch {
      toast('Failed to add webhook.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add Webhook</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Webhook name"
              required
            />
          </div>
          <div>
            <label className="label">URL</label>
            <input
              className="input-base"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60">
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddAlertRuleModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (r: AlertRule) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [condition, setCondition] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const rule = await createAlertRule({ name, condition, severity, enabled: true })
      toast('Alert rule created.', 'success')
      onCreated(rule)
    } catch {
      toast('Failed to create alert rule.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Alert Rule</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Rule Name</label>
            <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alert name" required />
          </div>
          <div>
            <label className="label">Condition</label>
            <input className="input-base" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. risk_score > 80" required />
          </div>
          <div>
            <label className="label">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input-base">
              {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('notifications')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [showAddAlert, setShowAddAlert] = useState(false)

  useEffect(() => {
    Promise.all([
      listNotifications().catch(() => [] as Notification[]),
      listWebhooks().catch(() => [] as Webhook[]),
      listAlertRules().catch(() => [] as AlertRule[]),
    ]).then(([n, w, a]) => { setNotifications(n); setWebhooks(w); setAlertRules(a) })
      .finally(() => setLoading(false))
  }, [])

  const handleMarkRead = async (id: string): Promise<void> => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    } catch {
      toast('Failed to mark as read.', 'error')
    }
  }

  const handleDeleteWebhook = async (id: string): Promise<void> => {
    try {
      await deleteWebhook(id)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      toast('Webhook deleted.', 'success')
    } catch {
      toast('Failed to delete webhook.', 'error')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Manage alerts, webhooks, and notification rules</p>
        </div>
        {tab === 'webhooks' && (
          <button
            onClick={() => setShowAddWebhook(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
          >
            <Plus className="h-4 w-4" />Add Webhook
          </button>
        )}
        {tab === 'alert-rules' && (
          <button
            onClick={() => setShowAddAlert(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
          >
            <Plus className="h-4 w-4" />Create Alert Rule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-nav mb-4 animate-in">
        {([
          { id: 'notifications' as Tab, label: 'Notifications', count: unreadCount },
          { id: 'webhooks' as Tab, label: 'Webhooks', count: 0 },
          { id: 'alert-rules' as Tab, label: 'Alert Rules', count: 0 },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-item ${tab === t.id ? 'active' : ''}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2 animate-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="shimmer h-4 rounded w-48 mb-2" />
              <div className="shimmer h-4 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Notifications tab */}
      {!loading && tab === 'notifications' && (
        <>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No notifications</p>
              <p className="empty-body">You are all caught up.</p>
            </div>
          ) : (
            <div className="space-y-2 animate-in">
              {notifications.map((n) => {
                const severity = (n as Record<string, string>).severity ?? 'low'
                const IconComp = severityIcon[severity] ?? Bell
                const iconStyle = severityIconColor[severity] ?? 'text-gray-600 bg-gray-50'
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 rounded-xl border bg-white p-4 transition ${
                      !n.read ? 'border-l-4 border-l-[#1B2A4A] border-gray-100' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconStyle}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{n.body}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition flex-shrink-0"
                      >
                        <CheckCheck className="h-3 w-3" />Mark read
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Webhooks tab */}
      {!loading && tab === 'webhooks' && (
        <>
          {webhooks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No webhooks configured</p>
              <p className="empty-body">Add webhooks to push events to external systems.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>URL</th>
                    <th>Events</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((wh) => (
                    <tr key={wh.id}>
                      <td className="font-medium text-gray-900">{wh.name}</td>
                      <td className="text-xs text-gray-500 font-mono truncate max-w-xs">{wh.url}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(wh.events ?? []).map((ev) => (
                            <span key={ev} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">{ev}</span>
                          ))}
                          {(!wh.events || wh.events.length === 0) && (
                            <span className="text-xs text-gray-400">No events</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${wh.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {wh.active ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-3 w-3" />Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Alert rules tab */}
      {!loading && tab === 'alert-rules' && (
        <>
          {alertRules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No alert rules</p>
              <p className="empty-body">Create rules to be notified when conditions are met.</p>
            </div>
          ) : (
            <div className="card animate-in overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Trigger / Condition</th>
                    <th>Channels</th>
                    <th>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {alertRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <p className="font-medium text-gray-900">{rule.name}</p>
                        {rule.description && (
                          <p className="text-xs text-gray-400">{rule.description}</p>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gray-600 bg-gray-50 rounded px-1.5 py-0.5">
                          {rule.condition}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500">
                        {(rule.channels ?? []).join(', ') || '-'}
                      </td>
                      <td>
                        {rule.enabled
                          ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                          : <ToggleLeft className="h-5 w-5 text-gray-400" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showAddWebhook && (
        <AddWebhookModal
          onClose={() => setShowAddWebhook(false)}
          onCreated={(w) => { setWebhooks((prev) => [w, ...prev]); setShowAddWebhook(false) }}
        />
      )}
      {showAddAlert && (
        <AddAlertRuleModal
          onClose={() => setShowAddAlert(false)}
          onCreated={(r) => { setAlertRules((prev) => [r, ...prev]); setShowAddAlert(false) }}
        />
      )}
    </Shell>
  )
}
