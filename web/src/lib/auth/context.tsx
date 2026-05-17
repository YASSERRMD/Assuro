'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface User {
  email: string
  orgId: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (token: string, u: User): void => {
    localStorage.setItem('assuro_token', token)
    setUser(u)
  }

  const logout = (): void => {
    localStorage.removeItem('assuro_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
