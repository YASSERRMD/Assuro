'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listTasks, createTask, updateTaskStatus, type Task } from '@/lib/api/tasks'
import { CheckSquare, Plus, X } from 'lucide-react'

const priorityBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
}

const statusBadge: Record<string, string> = {
  done: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  todo: 'bg-gray-100 text-gray-600',
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
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const task = await createTask({
        title,
        description,
        priority,
        assignee_email: assignee || undefined,
        due_date: dueDate || undefined,
        status: 'todo',
      })
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Task</h2>
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
              placeholder="Task title"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done?"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-base"
              >
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="label">Assignee Email</label>
            <input
              className="input-base"
              type="email"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="assignee@example.com"
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
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Track governance action items and assignments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />Create Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tab-nav mb-4 animate-in">
        {['all', 'todo', 'in_progress', 'blocked', 'done'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`tab-item ${filterStatus === s ? 'active' : ''}`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            {s !== 'all' && (
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusBadge[s] ?? 'bg-gray-100 text-gray-500'}`}>
                {tasks.filter((t) => t.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-5 rounded-full w-16 ml-auto" />
                <div className="shimmer h-5 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckSquare className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No tasks found</p>
          <p className="empty-body">
            {filterStatus === 'all'
              ? 'Create your first governance task.'
              : `No tasks with status "${filterStatus}".`}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <Plus className="h-4 w-4" />Create Task
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th className="text-right">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id}>
                  <td>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityBadge[task.priority] ?? 'bg-gray-100 text-gray-500'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[task.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500">{task.assignee_email ?? '-'}</td>
                  <td className="text-xs text-gray-500">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="text-right">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-[#1B2A4A] transition"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
