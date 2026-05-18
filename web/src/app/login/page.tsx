'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { ShieldCheck, AlertCircle } from 'lucide-react'

export default function LoginPage() {
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
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      )

      if (!res.ok) {
        setError('Invalid email or password. Please try again.')
        return
      }

      const data = await res.json()
      login(data.access_token, data.refresh_token ?? '')
      router.push('/dashboard')
    } catch {
      setError('Connection error — please check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Left panel — branding */}
      <div className="hidden w-[420px] flex-shrink-0 flex-col justify-between bg-[#0f1f3d] p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]">
            <ShieldCheck className="h-5 w-5 text-[#0f1f3d]" />
          </div>
          <span className="text-lg font-bold text-white">Assuro</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-snug text-white">
            AI Governance<br />made auditable.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Manage your AI system inventory, compute EU AI Act risk tiers,
            run framework assessments, and generate compliance evidence —
            all in one platform.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'EU AI Act', sub: 'Risk classification' },
              { label: 'NIST AI RMF', sub: 'Framework coverage' },
              { label: 'ISO 42001', sub: 'Management system' },
              { label: 'Evidence', sub: 'Audit-ready exports' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-semibold text-[#C9A84C]">{item.label}</p>
                <p className="mt-0.5 text-xs text-white/40">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/20">© 2025 Assuro. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f1f3d]">
              <ShieldCheck className="h-4 w-4 text-[#C9A84C]" />
            </div>
            <span className="text-base font-bold text-gray-900">Assuro</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your AI governance workspace</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-medium text-[#0f1f3d] hover:underline">
              Sign up
            </a>
          </p>

          <div className="mt-8 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">Demo credentials</p>
            <p className="mt-1 font-mono text-xs text-gray-400">admin@assuro.demo / demo1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
