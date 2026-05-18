'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listRoles, createRole, deleteRole, listRoleUsers, type Role, type RoleUser } from '@/lib/api/rbac'
import { Users, Plus, X, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

type Tab = 'roles' | 'users'

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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Create Role</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Role Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="E.g. compliance_analyst" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What can this role do?" rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10" />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create Role'}</Button>
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
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <button onClick={toggleExpand} className="text-gray-400 hover:text-gray-600 transition">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{role.name}</p>
          {role.description && (
            <p className="text-xs text-gray-500">{role.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{role.permissions.length} permissions</span>
          <button
            onClick={() => onDelete(role.id)}
            className="text-red-400 hover:text-red-600 transition rounded-md p-1 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {role.permissions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-[10px]">{perm}</Badge>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Users</p>
          {loadingUsers && <Skeleton className="h-4 w-32" />}
          {!loadingUsers && users.length === 0 && (
            <p className="text-xs text-gray-400">No users assigned to this role.</p>
          )}
          {!loadingUsers && users.length > 0 && (
            <div className="space-y-1">
              {users.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{u.email}</span>
                  <span className="text-[10px] text-gray-400">{new Date(u.assigned_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function RBACPage() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<Tab>('roles')

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RBAC</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage roles, permissions, and user assignments</p>
        </div>
        {tab === 'roles' && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Create Role
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-gray-200">
        {(['roles', 'users'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-4 text-sm font-medium transition border-b-2 -mb-px capitalize ${
              tab === t ? 'border-[#0f1f3d] text-[#0f1f3d]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </Card>
            ))}
          </div>
        )}

        {tab === 'roles' && !loading && (
          <>
            {roles.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <Users className="h-8 w-8 text-indigo-200" />
                </div>
                <p className="text-base font-semibold text-gray-700">No roles defined</p>
                <p className="text-sm text-gray-400">Create roles to manage access control.</p>
                <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="h-4 w-4" />Create Role
                </Button>
              </div>
            )}
            {roles.length > 0 && (
              <div className="space-y-3">
                {roles.map((role) => (
                  <RoleRow key={role.id} role={role} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'users' && !loading && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Expand a role in the Roles tab to see user assignments.
            </p>
            <div className="mt-4 space-y-3">
              {roles.map((role) => (
                <Card key={role.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                    <p className="text-xs text-gray-400">{role.permissions.length} permissions</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRoleModal
          onClose={() => setShowCreate(false)}
          onCreated={(r) => { setRoles((prev) => [r, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
