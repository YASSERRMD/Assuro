import { typedFetch } from '@/lib/api'

export interface Role {
  id: string
  org_id: string
  name: string
  description: string
  created_at: string
}

export interface RolePermission {
  role_id: string
  permission: string
  granted_at: string
}

export async function listRoles(): Promise<Role[]> {
  return typedFetch<Role[]>('/v1/roles')
}

export async function createRole(data: { name: string; description?: string }): Promise<Role> {
  return typedFetch<Role>('/v1/roles', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteRole(id: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}`, { method: 'DELETE' })
}

export async function listRolePermissions(id: string): Promise<RolePermission[]> {
  return typedFetch<RolePermission[]>(`/v1/roles/${id}/permissions`)
}

export async function addRolePermission(id: string, permission: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}/permissions`, { method: 'POST', body: JSON.stringify({ permission }) })
}

export async function removeRolePermission(id: string, permission: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}/permissions/${encodeURIComponent(permission)}`, { method: 'DELETE' })
}
