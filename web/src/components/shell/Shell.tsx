'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/Button'
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  BookOpen,
  FileText,
  AlertTriangle,
  BarChart2,
  LogOut,
  ShieldCheck,
  Bot,
  Shield,
  Building2,
  CheckSquare,
  FileCheck,
  BookMarked,
  TestTube2,
  GitPullRequest,
  TrendingUp,
  Plug,
  Bell,
  Users,
  Scale,
  ScrollText,
  Download,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'AI Systems', href: '/ai-systems', icon: Cpu },
      { label: 'Agents', href: '/agents', icon: Bot },
      { label: 'Guardrails', href: '/guardrails', icon: Shield },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'Assessments', href: '/assessments', icon: ClipboardList },
      { label: 'Frameworks', href: '/frameworks', icon: BookOpen },
      { label: 'Evidence', href: '/evidence', icon: FileText },
      { label: 'Regulatory', href: '/regulatory', icon: Scale },
    ],
  },
  {
    title: 'Risk',
    items: [
      { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
      { label: 'Vendors', href: '/vendors', icon: Building2 },
    ],
  },
  {
    title: 'Governance',
    items: [
      { label: 'Policies', href: '/policies', icon: FileCheck },
      { label: 'Approvals', href: '/approvals', icon: GitPullRequest },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'AI Quality',
    items: [
      { label: 'Model Cards', href: '/model-cards', icon: BookMarked },
      { label: 'Model Testing', href: '/model-testing', icon: TestTube2 },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Analytics', href: '/analytics', icon: TrendingUp },
      { label: 'Reports', href: '/reports', icon: BarChart2 },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Connectors', href: '/connectors', icon: Plug },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'RBAC', href: '/rbac', icon: Users },
      { label: 'Audit', href: '/audit', icon: ScrollText },
      { label: 'Export', href: '/export', icon: Download },
    ],
  },
]

const allNavItems = navSections.flatMap((s) => s.items)

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = (): void => {
    logout()
    router.replace('/login')
  }

  const currentPage = allNavItems.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-60 flex-col bg-[#0f1f3d] text-white overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold">
            <ShieldCheck className="h-5 w-5 text-[#0f1f3d]" />
          </div>
          <div>
            <span className="text-base font-bold text-white">Assuro</span>
            <p className="text-[10px] text-white/40 leading-none mt-0.5">AI Governance</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-white/10 text-gold'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-gold' : 'text-white/50'}`} />
                      {item.label}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white/80">{user?.email ?? ''}</p>
              <p className="text-[10px] text-white/40 capitalize">{user?.role ?? ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 rounded p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2">
            {currentPage && <currentPage.icon className="h-4 w-4 text-gray-400" />}
            <span className="text-sm font-semibold text-gray-800">
              {currentPage?.label ?? 'Assuro'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            <Button variant="ghost" onClick={handleLogout} className="text-sm gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
