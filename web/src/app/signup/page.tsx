'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'

export default function SignupPage() {
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/v1/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_name: orgName, org_slug: orgSlug, email, password }),
        },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError((body as { message?: string } | null)?.message ?? 'Signup failed')
        return
      }

      const data = await res.json()
      login(data.access_token, data.refresh_token ?? '')
      router.push('/dashboard')
    } catch {
      setError('Connection error - please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-light">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-md"
      >
        <div>
          <h1 className="text-xl font-bold text-navy">Create account</h1>
          <p className="text-sm text-gray-500">Set up your organization on Assuro</p>
        </div>
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Input
          label="Organization name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          required
        />
        <Input
          label="Organization slug"
          value={orgSlug}
          onChange={(e) => setOrgSlug(e.target.value)}
          required
          placeholder="e.g. acme-corp"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
        <p className="text-center text-sm text-gray-500">
          Have an account?{' '}
          <a href="/login" className="text-navy underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  )
}
