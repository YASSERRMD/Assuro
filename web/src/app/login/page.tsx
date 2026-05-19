'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(140deg, #060d1a 0%, #0d1526 50%, #0f1c35 100%)' }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-30" />

      {/* Gold glow — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 65%)' }}
      />
      {/* Blue glow — top right */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)' }}
      />

      {/* Thin gold top bar */}
      <div
        className="absolute top-0 inset-x-0 h-0.5"
        style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 40%, #C9A84C 60%, transparent)' }}
      />

      <div className="relative z-10 w-full max-w-md px-6">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #C9A84C 0%, #e0bc6a 100%)',
              boxShadow: '0 0 40px rgba(201,168,76,0.3), 0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <Shield className="h-8 w-8 text-[#0d1526]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Assuro</h1>
          <p className="mt-1 text-sm text-white/35">AI Governance & Compliance Platform</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <h2 className="mb-1 text-xl font-semibold text-white">Welcome back</h2>
          <p className="mb-6 text-sm text-white/35">Sign in to your governance workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => { e.target.style.border = '1px solid rgba(201,168,76,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid rgba(201,168,76,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-150 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #d4a832 100%)',
                color: '#0d1526',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(201,168,76,0.35)',
              }}
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-white/30">
            No account?{' '}
            <a href="/signup" className="font-medium text-[#C9A84C] hover:underline">
              Sign up
            </a>
          </p>
        </div>

        {/* Demo credentials */}
        <div
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-white/40">Demo credentials</p>
            <p className="mt-0.5 font-mono text-[11px] text-white/25">admin@assuro.demo / demo1234</p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-white/15">
          SOC 2 Ready · GDPR Compliant · ISO 42001 Aligned
        </p>
      </div>
    </div>
  )
}
