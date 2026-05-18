'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import {
  Shield, Eye, EyeOff, AlertCircle,
  CheckCircle2, BarChart3, Zap, Globe,
} from 'lucide-react'

const features = [
  { icon: Shield,    title: 'EU AI Act Ready',      desc: 'Automated risk tier classification' },
  { icon: BarChart3, title: 'NIST AI RMF',           desc: 'End-to-end framework coverage' },
  { icon: Zap,       title: 'Real-time Monitoring',  desc: 'Signals, anomalies, guardrails' },
  { icon: Globe,     title: 'Audit-ready Evidence',  desc: 'One-click compliance exports' },
]

export default function SignupPage() {
  const [orgName, setOrgName]     = useState('')
  const [orgSlug, setOrgSlug]     = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showCf, setShowCf]       = useState(false)
  const [terms, setTerms]         = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!terms) { setError('You must accept the terms to continue.'); return }
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
      setError('Connection error. Please check your network.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Left panel - branding */}
      <div
        className="relative hidden w-[520px] flex-shrink-0 overflow-hidden lg:flex lg:flex-col"
        style={{ background: 'linear-gradient(160deg, #0a1020 0%, #0d1a32 55%, #0f1f3d 100%)' }}
      >
        {/* Dot-grid texture */}
        <div className="absolute inset-0 bg-dot-grid opacity-100" />

        {/* Gold glow blob */}
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
        />
        <div
          className="absolute -top-20 right-0 h-64 w-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bc6a 100%)' }}
            >
              <Shield className="h-5 w-5 text-[#0a1020]" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Assuro</span>
          </div>

          {/* Headline */}
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium text-white/60">Free to get started</span>
            </div>
            <h1 className="mt-4 text-[38px] font-bold leading-[1.1] tracking-tight">
              <span className="text-white">Start governing</span>
              <br />
              <span style={{
                background: 'linear-gradient(90deg, #C9A84C 0%, #e8cc80 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                your AI systems.
              </span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/45 max-w-[340px]">
              Set up your workspace in seconds. Everything you need to assess,
              track and report on AI risk is ready on day one.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {features.map(f => (
                <div key={f.title} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
                  >
                    <f.icon className="h-4 w-4 text-[#C9A84C]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{f.title}</p>
                    <p className="text-xs text-white/35">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-white/20" />
            <p className="text-xs text-white/20">SOC 2 ready · GDPR compliant · ISO 42001 aligned</p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-6 overflow-y-auto">
        <div className="w-full max-w-[420px] animate-in">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0d1526]">
              <Shield className="h-4 w-4 text-[#C9A84C]" />
            </div>
            <span className="text-base font-bold text-gray-900">Assuro</span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create your workspace</h2>
              <p className="mt-1 text-sm text-gray-500">Set up your organization on Assuro</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Org row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="org-name">Organization name</label>
                  <input
                    id="org-name"
                    className="input-base"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="org-slug">Slug</label>
                  <input
                    id="org-slug"
                    className="input-base"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="acme-corp"
                    required
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Lowercase, hyphens only</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label" htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  className="input-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className="input-base pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="label" htmlFor="confirm">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showCf ? 'text' : 'password'}
                    className="input-base pr-10"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#1B2A4A]"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-[#1B2A4A] hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="font-medium text-[#1B2A4A] hover:underline">Privacy Policy</a>.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60"
                style={{
                  background: loading
                    ? '#1B2A4A'
                    : 'linear-gradient(135deg, #0d1526 0%, #1B2A4A 100%)',
                  boxShadow: loading ? 'none' : '0 2px 12px rgba(13,21,38,0.25)',
                }}
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {loading ? 'Creating workspace...' : 'Create workspace'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-[#1B2A4A] hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
