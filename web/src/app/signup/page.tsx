'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { setToken } from '@/lib/api'
import { useAuth } from '@/lib/auth/context'

export default function SignupPage() {
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_name: orgName, org_slug: orgSlug, email, password }),
      })

      if (!res.ok) {
        setError('Signup failed')
        return
      }

      const data = await res.json()
      setToken(data.access_token)
      login(data.access_token, { email, orgId: '', role: 'owner' })
      router.push('/dashboard')
    } catch {
      setError('Signup failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-light">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-bold text-navy">Create account</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Input label="Organization" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
        <Input label="Slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full">Sign up</Button>
        <p className="text-center text-sm text-gray-500">
          Have an account? <a href="/login" className="text-navy underline">Sign in</a>
        </p>
      </form>
    </div>
  )
}
