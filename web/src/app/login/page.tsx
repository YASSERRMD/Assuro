'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { setToken } from '@/lib/api'
import { useAuth } from '@/lib/auth/context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setError('Invalid credentials')
        return
      }

      const data = await res.json()
      setToken(data.access_token)
      login(data.access_token, { email, orgId: '', role: '' })
      router.push('/dashboard')
    } catch {
      setError('Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-light">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-bold text-navy">Sign in to Assuro</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full">Sign in</Button>
        <p className="text-center text-sm text-gray-500">
          No account? <a href="/signup" className="text-navy underline">Sign up</a>
        </p>
      </form>
    </div>
  )
}
