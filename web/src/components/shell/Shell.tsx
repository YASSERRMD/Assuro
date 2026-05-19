'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import {
  LayoutDashboard, Cpu, Bot, Shield,
  ClipboardList, BookOpen, FileText, Scale,
  AlertTriangle, Building2,
  FileBadge, GitPullRequest, CheckSquare,
  BookMarked, TestTube2,
  TrendingUp, BarChart2,
  Plug, Bell, Users, ScrollText, Download,
  LogOut, ChevronRight,
} from 'lucide-react'

const nav = [
  {
    section: 'Core',
    items: [
      { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
      { label: 'AI Systems',  href: '/ai-systems',  icon: Cpu },
      { label: 'Agents',      href: '/agents',      icon: Bot },
      { label: 'Guardrails',  href: '/guardrails',  icon: Shield },
    ],
  },
  {
    section: 'Compliance',
    items: [
      { label: 'Assessments', href: '/assessments', icon: ClipboardList },
      { label: 'Frameworks',  href: '/frameworks',  icon: BookOpen },
      { label: 'Evidence',    href: '/evidence',    icon: FileText },
      { label: 'Regulatory',  href: '/regulatory',  icon: Scale },
    ],
  },
  {
    section: 'Risk',
    items: [
      { label: 'Incidents',   href: '/incidents',   icon: AlertTriangle },
      { label: 'Vendors',     href: '/vendors',     icon: Building2 },
    ],
  },
  {
    section: 'Governance',
    items: [
      { label: 'Policies',    href: '/policies',    icon: FileBadge },
      { label: 'Approvals',   href: '/approvals',   icon: GitPullRequest },
      { label: 'Tasks',       href: '/tasks',       icon: CheckSquare },
    ],
  },
  {
    section: 'AI Quality',
    items: [
      { label: 'Model Cards',   href: '/model-cards',   icon: BookMarked },
      { label: 'Model Testing', href: '/model-testing', icon: TestTube2 },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { label: 'Analytics', href: '/analytics', icon: TrendingUp },
      { label: 'Reports',   href: '/reports',   icon: BarChart2 },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'Connectors',     href: '/connectors',     icon: Plug },
      { label: 'Notifications',  href: '/notifications',  icon: Bell },
      { label: 'RBAC',           href: '/rbac',           icon: Users },
      { label: 'Audit',          href: '/audit',          icon: ScrollText },
      { label: 'Export',         href: '/export',         icon: Download },
    ],
  },
]

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router  = useRouter()

  const handleLogout = () => { logout(); router.replace('/login') }

  const activeLabel = nav
    .flatMap(g => g.items)
    .find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Assuro'

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">

      {/* Sidebar */}
      <aside
        className="flex w-[240px] flex-shrink-0 flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0d1526 0%, #0f1c35 100%)',
          boxShadow: '1px 0 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bc6a 100%)' }}
          >
            <Shield className="h-4 w-4 text-[#0d1526]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-none tracking-tight text-white">Assuro</p>
            <p className="mt-0.5 text-[10px] leading-none text-white/30">AI Governance</p>
          </div>
        </div>

        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 pt-1" style={{ scrollbarWidth: 'none' }}>
          {nav.map(group => (
            <div key={group.section}>
              <p className="nav-section-label">{group.section}</p>
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${active ? 'active' : ''}`}
                  >
                    <Icon
                      className="h-[15px] w-[15px] flex-shrink-0"
                      style={{ color: active ? '#C9A84C' : 'rgba(255,255,255,0.45)' }}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight className="ml-auto h-3 w-3 text-white/20" strokeWidth={2} />
                    )}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="mx-3 h-px bg-white/[0.06]" />
        <div className="px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[0.05]">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[#0d1526]"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bc6a 100%)' }}
            >
              {initials(user?.email ?? 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-white/75">{user?.email ?? ''}</p>
              <p className="text-[10px] capitalize text-white/35">{user?.role ?? 'member'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 rounded-md p-1 text-white/30 transition hover:bg-white/10 hover:text-white/70"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 text-xs">Assuro</span>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="font-semibold text-gray-800 text-sm">{activeLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-[#0d1526]"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bc6a 100%)' }}
            >
              {initials(user?.email ?? 'U')}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
