import { typedFetch } from '@/lib/api'

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface RoleUser {
  user_id: string
  email: string
  assigned_at: string
}

export async function listRoles(): Promise<Role[]> {
  return typedFetch<Role[]>('/v1/roles')
}

export async function createRole(data: Partial<Role>): Promise<Role> {
  return typedFetch<Role>('/v1/roles', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteRole(id: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}`, { method: 'DELETE' })
}

export async function addRolePermission(id: string, permission: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}/permissions`, { method: 'POST', body: JSON.stringify({ permission }) })
}

export async function removeRolePermission(id: string, perm: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}/permissions/${perm}`, { method: 'DELETE' })
}

export async function listRoleUsers(id: string): Promise<RoleUser[]> {
  return typedFetch<RoleUser[]>(`/v1/roles/${id}/users`)
}

export async function addRoleUser(id: string, userId: string): Promise<void> {
  return typedFetch<void>(`/v1/roles/${id}/users`, { method: 'POST', body: JSON.stringify({ user_id: userId }) })
}
