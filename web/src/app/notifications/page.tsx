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
import { Bell, X, Plus, Trash2, CheckCheck } from 'lucide-react'

type Tab = 'notifications' | 'webhooks' | 'alert-rules'

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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add Webhook</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Webhook name" required />
          <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add'}</Button>
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Alert Rule</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Rule Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alert name" required />
          <Input label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)}
            placeholder="E.g. risk_score > 80" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
              {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'alert-rules', label: 'Alert Rules' },
  ]

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage alerts, webhooks, and notification rules</p>
        </div>
        {tab === 'webhooks' && (
          <Button onClick={() => setShowAddWebhook(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Webhook
          </Button>
        )}
        {tab === 'alert-rules' && (
          <Button onClick={() => setShowAddAlert(true)} className="gap-2">
            <Plus className="h-4 w-4" />Create Alert Rule
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2 px-4 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.id ? 'border-[#0f1f3d] text-[#0f1f3d]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </Card>
            ))}
          </div>
        )}

        {/* Notifications tab */}
        {!loading && tab === 'notifications' && (
          <>
            {notifications.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                  <Bell className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-base font-semibold text-gray-700">No notifications</p>
                <p className="text-sm text-gray-400">You are all caught up.</p>
              </div>
            )}
            {notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <Card key={n.id} className={`flex items-start gap-3 ${n.read ? 'opacity-60' : ''}`}>
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${n.read ? 'bg-gray-50' : 'bg-amber-50'}`}>
                      <Bell className={`h-4 w-4 ${n.read ? 'text-gray-400' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{n.body}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition flex-shrink-0"
                      >
                        <CheckCheck className="h-3 w-3" />Mark read
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Webhooks tab */}
        {!loading && tab === 'webhooks' && (
          <>
            {webhooks.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                  <Bell className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-base font-semibold text-gray-700">No webhooks configured</p>
                <p className="text-sm text-gray-400">Add webhooks to push events to external systems.</p>
              </div>
            )}
            {webhooks.length > 0 && (
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <Card key={wh.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{wh.name}</p>
                      <p className="text-xs text-gray-500 truncate">{wh.url}</p>
                    </div>
                    <Badge variant={wh.active ? 'success' : 'default'}>{wh.active ? 'Active' : 'Inactive'}</Badge>
                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Alert rules tab */}
        {!loading && tab === 'alert-rules' && (
          <>
            {alertRules.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                  <Bell className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-base font-semibold text-gray-700">No alert rules</p>
                <p className="text-sm text-gray-400">Create rules to be notified when conditions are met.</p>
              </div>
            )}
            {alertRules.length > 0 && (
              <div className="space-y-3">
                {alertRules.map((rule) => (
                  <Card key={rule.id} className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
                        <Badge variant={rule.enabled ? 'success' : 'default'}>{rule.enabled ? 'Active' : 'Disabled'}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-mono text-gray-500">{rule.condition}</p>
                      {rule.description && (
                        <p className="mt-0.5 text-xs text-gray-400">{rule.description}</p>
                      )}
                    </div>
                    <Badge variant={rule.severity === 'critical' ? 'danger' : rule.severity === 'high' ? 'warning' : 'default'} className="capitalize flex-shrink-0">
                      {rule.severity}
                    </Badge>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
