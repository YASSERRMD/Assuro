const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

const ACCESS_KEY = 'assuro_token'
const REFRESH_KEY = 'assuro_refresh_token'

/** typedFetch is a typed wrapper around fetch with automatic token attachment and 401 refresh. */
export async function typedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  }

  // Omit Content-Type for FormData so the browser sets it with the boundary.
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  // On 401 try to refresh once.
  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`
      res = await fetch(`${API_BASE}${path}`, { ...init, headers })
    }
  }

  if (res.status === 401) {
    clearTokens()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('unauthenticated')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error((body as { message?: string } | null)?.message ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

async function tryRefresh(): Promise<boolean> {
  const refresh = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null
  if (!refresh) return false

  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setToken(data.access_token)
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_KEY, data.refresh_token)
    }
    return true
  } catch {
    return false
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_KEY, token)
}

function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
