'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listRoles, createRole, deleteRole, listRoleUsers, type Role, type RoleUser } from '@/lib/api/rbac'
import { Users, Plus, X, Trash2, ChevronDown, ChevronRight, Shield, Key } from 'lucide-react'

function CreateRoleModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (r: Role) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const role = await createRole({ name, description, permissions: [] })
      toast('Role created.', 'success')
      onCreated(role)
    } catch {
      toast('Failed to create role.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Create Role</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Role Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. compliance_analyst"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can this role do?"
              rows={3}
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
              {submitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoleRow({ role, onDelete }: { role: Role; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [users, setUsers] = useState<RoleUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const toggleExpand = async (): Promise<void> => {
    if (!expanded && users.length === 0) {
      setLoadingUsers(true)
      listRoleUsers(role.id)
        .then(setUsers)
        .catch(() => setUsers([]))
        .finally(() => setLoadingUsers(false))
    }
    setExpanded(!expanded)
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={toggleExpand}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <Shield className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{role.name}</p>
          {role.description && (
            <p className="text-xs text-gray-500 truncate">{role.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 tabular-nums">
            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => onDelete(role.id)}
            className="rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
          {role.permissions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                <Key className="h-3 w-3" />Permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
              <Users className="h-3 w-3" />Assigned Users
            </p>
            {loadingUsers && (
              <div className="space-y-1">
                <div className="shimmer h-4 rounded w-40" />
                <div className="shimmer h-4 rounded w-32" />
              </div>
            )}
            {!loadingUsers && users.length === 0 && (
              <p className="text-xs text-gray-400">No users assigned to this role.</p>
            )}
            {!loadingUsers && users.length > 0 && (
              <div className="space-y-1.5">
                {users.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">{u.email}</span>
                    <span className="text-[10px] text-gray-400">
                      Assigned {new Date(u.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RBACPage() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<'roles' | 'users'>('roles')

  useEffect(() => {
    listRoles()
      .then(setRoles)
      .catch(() => setRoles([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this role?')) return
    try {
      await deleteRole(id)
      setRoles((prev) => prev.filter((r) => r.id !== id))
      toast('Role deleted.', 'success')
    } catch {
      toast('Failed to delete role.', 'error')
    }
  }

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">RBAC</h1>
          <p className="page-subtitle">Manage roles, permissions, and user assignments</p>
        </div>
        {tab === 'roles' && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
          >
            <Plus className="h-4 w-4" />Create Role
          </button>
        )}
      </div>

      <nav className="tab-nav mb-5">
        {(['roles', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-item capitalize ${tab === t ? 'active' : ''}`}
          >
            {t === 'roles' ? 'Roles' : 'User Assignments'}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="space-y-3 animate-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="shimmer h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-4 rounded w-36" />
                <div className="shimmer h-3 rounded w-52" />
              </div>
              <div className="shimmer h-4 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'roles' && (
        <>
          {roles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No roles defined</p>
              <p className="empty-body">Create roles to manage access control across your workspace.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                <Plus className="h-4 w-4" />Create Role
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-in">
              {roles.map((role) => (
                <RoleRow key={role.id} role={role} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {!loading && tab === 'users' && (
        <>
          {roles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <p className="empty-title">No roles yet</p>
              <p className="empty-body">Create roles first, then expand them to view user assignments.</p>
            </div>
          ) : (
            <div className="card overflow-hidden animate-in">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    <th className="text-right">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50">
                            <Shield className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900">{role.name}</span>
                        </div>
                      </td>
                      <td className="text-gray-500 text-xs">{role.description || '-'}</td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {role.permissions.slice(0, 3).map((p) => (
                            <span key={p} className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              {p}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="text-xs text-gray-400">+{role.permissions.length - 3} more</span>
                          )}
                          {role.permissions.length === 0 && (
                            <span className="text-xs text-gray-400">No permissions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-50">
                Expand a role in the Roles tab to see and manage individual user assignments.
              </p>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateRoleModal
          onClose={() => setShowCreate(false)}
          onCreated={(r) => { setRoles((prev) => [r, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
