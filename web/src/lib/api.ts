const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

// typedFetch is a typed wrapper around fetch with token handling.
export async function typedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('unauthenticated')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('assuro_token')
}

function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('assuro_token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('assuro_token', token)
}
