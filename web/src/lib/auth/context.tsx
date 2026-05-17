'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

export interface User {
  email: string
  orgId: string
  role: string
  userId: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const ACCESS_KEY = 'assuro_token'
const REFRESH_KEY = 'assuro_refresh_token'

/** Decode JWT payload without verifying signature (client-side only). */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(payload)
  } catch {
    return null
  }
}

/** Return true when the access token is still valid (exp > now + 30s buffer). */
function isTokenValid(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > Date.now() + 30_000
}

function userFromToken(token: string): User | null {
  const payload = decodeJWT(token)
  if (!payload) return null
  return {
    userId: String(payload.user_id ?? ''),
    orgId: String(payload.org_id ?? ''),
    role: String(payload.role ?? 'viewer'),
    email: String(payload.email ?? ''),
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore user from stored token on mount.
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY)
    if (token && isTokenValid(token)) {
      setUser(userFromToken(token))
    } else {
      // Try to refresh silently.
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (refresh) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'
        fetch(`${apiBase}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.access_token) {
              localStorage.setItem(ACCESS_KEY, data.access_token)
              localStorage.setItem(REFRESH_KEY, data.refresh_token)
              setUser(userFromToken(data.access_token))
            }
          })
          .catch(() => null)
          .finally(() => setIsLoading(false))
        return
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    setUser(userFromToken(accessToken))
  }, [])

  const logout = useCallback((): void => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Get the stored access token (for use outside React). */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}
