'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import {
  Shield, Eye, EyeOff, AlertCircle,
  CheckCircle2, Lock, Zap, Globe, BarChart3,
} from 'lucide-react'

const features = [
  { icon: Shield,    title: 'EU AI Act Ready',      desc: 'Automated risk tier classification' },
  { icon: BarChart3, title: 'NIST AI RMF',           desc: 'End-to-end framework coverage' },
  { icon: Zap,       title: 'Real-time Monitoring',  desc: 'Signals, anomalies, guardrails' },
  { icon: Globe,     title: 'Audit-ready Evidence',  desc: 'One-click compliance exports' },
]

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (!res.ok) { setError('Invalid email or password.'); return }
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

      {/* ── Left panel — branding ── */}
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
              <span className="text-[11px] font-medium text-white/60">Platform v2.0 — 40 modules</span>
            </div>
            <h1 className="mt-4 text-[38px] font-bold leading-[1.1] tracking-tight">
              <span className="text-white">AI Governance</span>
              <br />
              <span style={{
                background: 'linear-gradient(90deg, #C9A84C 0%, #e8cc80 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                made auditable.
              </span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/45 max-w-[340px]">
              The complete platform for AI risk classification, compliance
              evidence, agent governance, and regulatory intelligence.
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

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-6">
        <div className="w-full max-w-[400px] animate-in">

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
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to your governance workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="input-base"
                />
              </div>

              {/* Password */}
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="input-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPw
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye    className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              No account?{' '}
              <a href="/signup" className="font-semibold text-[#1B2A4A] hover:underline">
                Sign up
              </a>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3">
            <Lock className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
            <div>
              <p className="text-xs font-medium text-gray-500">Demo credentials</p>
              <p className="mt-0.5 font-mono text-xs text-gray-400">admin@assuro.demo / demo1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
