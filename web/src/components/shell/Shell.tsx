'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/Button'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'AI Systems', href: '/ai-systems' },
  { label: 'Assessments', href: '/assessments' },
  { label: 'Frameworks', href: '/frameworks' },
  { label: 'Evidence', href: '/evidence' },
  { label: 'Incidents', href: '/incidents' },
  { label: 'Reports', href: '/reports' },
]

interface ShellProps {
  children: React.ReactNode
}

/** Shell provides the app navigation shell for all protected pages. */
export function Shell({ children }: ShellProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = (): void => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="flex min-h-screen bg-light">
      <aside className="flex w-56 flex-col bg-navy-dark text-white">
        <div className="border-b border-navy px-4 py-4">
          <span className="text-lg font-bold text-gold">Assuro</span>
          <p className="mt-0.5 text-xs text-gray-400">AI Governance</p>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-navy font-medium text-gold'
                    : 'text-gray-300 hover:bg-navy hover:text-white'
                }`}
              >
                {item.label}
              </a>
            )
          })}
        </nav>
        <div className="border-t border-navy px-4 py-3">
          <p className="truncate text-xs text-gray-400">{user?.email ?? ''}</p>
          <p className="mt-0.5 text-xs text-gray-500 capitalize">{user?.role ?? ''}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="text-sm font-medium text-gray-700">
            {navItems.find((n) => pathname.startsWith(n.href))?.label ?? 'Assuro'}
          </span>
          <Button variant="ghost" onClick={handleLogout} className="text-sm">
            Logout
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
