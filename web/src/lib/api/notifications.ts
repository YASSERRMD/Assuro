import { typedFetch } from '@/lib/api'

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  read: boolean
  created_at: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  secret?: string
  created_at: string
  updated_at: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  condition: string
  severity: string
  enabled: boolean
  created_at: string
}

export async function listNotifications(): Promise<Notification[]> {
  return typedFetch<Notification[]>('/v1/notifications')
}

export async function createNotification(data: Partial<Notification>): Promise<Notification> {
  return typedFetch<Notification>('/v1/notifications', { method: 'POST', body: JSON.stringify(data) })
}

export async function markNotificationRead(id: string): Promise<void> {
  return typedFetch<void>(`/v1/notifications/${id}/read`, { method: 'POST' })
}

export async function listWebhooks(): Promise<Webhook[]> {
  return typedFetch<Webhook[]>('/v1/webhooks')
}

export async function createWebhook(data: Partial<Webhook>): Promise<Webhook> {
  return typedFetch<Webhook>('/v1/webhooks', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook> {
  return typedFetch<Webhook>(`/v1/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteWebhook(id: string): Promise<void> {
  return typedFetch<void>(`/v1/webhooks/${id}`, { method: 'DELETE' })
}

export async function listAlertRules(): Promise<AlertRule[]> {
  return typedFetch<AlertRule[]>('/v1/alert-rules')
}

export async function createAlertRule(data: Partial<AlertRule>): Promise<AlertRule> {
  return typedFetch<AlertRule>('/v1/alert-rules', { method: 'POST', body: JSON.stringify(data) })
}
