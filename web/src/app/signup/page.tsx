'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth/context'
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'

const features = [
  'AI system inventory and risk classification',
  'EU AI Act, NIST AI RMF and ISO 42001 frameworks',
  'Automated compliance assessments',
  'Evidence management and audit exports',
]

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
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Left panel - branding */}
      <div className="hidden w-[420px] flex-shrink-0 flex-col justify-between bg-[#0f1f3d] p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]">
            <ShieldCheck className="h-5 w-5 text-[#0f1f3d]" />
          </div>
          <span className="text-lg font-bold text-white">Assuro</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-snug text-white">
            Start governing<br />your AI systems.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Set up your workspace in seconds. Everything you need to assess, track
            and report on AI risk is ready on day one.
          </p>

          <div className="mt-10 space-y-3">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C9A84C]" />
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/20">© 2025 Assuro. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f1f3d]">
              <ShieldCheck className="h-4 w-4 text-[#C9A84C]" />
            </div>
            <span className="text-base font-bold text-gray-900">Assuro</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Create your workspace</h1>
          <p className="mt-1 text-sm text-gray-500">Set up your organization on Assuro</p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                placeholder="Acme Corp"
              />
              <Input
                label="Slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
                placeholder="acme-corp"
                hint="Lowercase, hyphens only"
              />
            </div>
            <Input
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
            />

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? 'Creating workspace…' : 'Create workspace'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-[#0f1f3d] underline underline-offset-4 hover:opacity-70">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
