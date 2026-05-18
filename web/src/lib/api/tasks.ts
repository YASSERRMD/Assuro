import { typedFetch } from '@/lib/api'

export interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assignee_id?: string
  assignee_email?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  author_email: string
  body: string
  created_at: string
}

export async function listTasks(params?: Record<string, string>): Promise<Task[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return typedFetch<Task[]>(`/v1/tasks${qs}`)
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  return typedFetch<Task>('/v1/tasks', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateTaskStatus(id: string, status: string): Promise<Task> {
  return typedFetch<Task>(`/v1/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export async function assignTask(id: string, assigneeId: string): Promise<Task> {
  return typedFetch<Task>(`/v1/tasks/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignee_id: assigneeId }) })
}

export async function listTaskComments(id: string): Promise<TaskComment[]> {
  return typedFetch<TaskComment[]>(`/v1/tasks/${id}/comments`)
}

export async function addTaskComment(id: string, body: string): Promise<TaskComment> {
  return typedFetch<TaskComment>(`/v1/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) })
}
