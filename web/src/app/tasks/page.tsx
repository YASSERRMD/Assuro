'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listTasks, createTask, updateTaskStatus, type Task } from '@/lib/api/tasks'
import { CheckSquare, Plus, X } from 'lucide-react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'done' || status === 'completed') return 'success'
  if (status === 'in_progress') return 'info'
  if (status === 'blocked') return 'danger'
  return 'default'
}

const priorityVariant = (priority: string): BadgeVariant => {
  if (priority === 'critical') return 'danger'
  if (priority === 'high') return 'warning'
  if (priority === 'medium') return 'info'
  return 'default'
}

const statusOptions = ['todo', 'in_progress', 'blocked', 'done']

function CreateTaskModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (t: Task) => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const task = await createTask({ title, description, priority, due_date: dueDate || undefined, status: 'todo' })
      toast('Task created.', 'success')
      onCreated(task)
    } catch {
      toast('Failed to create task.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Task</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done?" rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create Task'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (task: Task, newStatus: string): Promise<void> => {
    try {
      const updated = await updateTaskStatus(task.id, newStatus)
      setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t))
      toast('Status updated.', 'success')
    } catch {
      toast('Failed to update status.', 'error')
    }
  }

  const filtered = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus)

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track governance action items and assignments</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filter bar */}
      <div className="mt-5 flex flex-wrap gap-2">
        {['all', ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filterStatus === s
                ? 'bg-[#0f1f3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 ring-1 ring-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <CheckSquare className="h-8 w-8 text-indigo-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No tasks found</p>
            <p className="mt-1 text-sm text-gray-400">
              {filterStatus === 'all' ? 'Create your first governance task.' : `No tasks with status "${filterStatus}".`}
            </p>
          </div>
          {filterStatus === 'all' && (
            <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />Create Task
            </Button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-4 space-y-2">
          {filtered.map((task) => (
            <Card key={task.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">{task.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant={priorityVariant(task.priority)} className="capitalize">{task.priority}</Badge>
                  {task.assignee_email && (
                    <span className="text-xs text-gray-400">{task.assignee_email}</span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-gray-400">Due {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task, e.target.value)}
                className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none transition focus:border-[#0f1f3d]"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <Badge variant={statusVariant(task.status)} className="capitalize whitespace-nowrap">
                {task.status.replace(/_/g, ' ')}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => { setTasks((prev) => [t, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
