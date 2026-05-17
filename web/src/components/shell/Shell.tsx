'use client'

import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/Button'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'AI Systems', href: '/ai-systems' },
  { label: 'Assessments', href: '/assessments' },
  { label: 'Frameworks', href: '/frameworks' },
  { label: 'Incidents', href: '/incidents' },
  { label: 'Reports', href: '/reports' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-navy-dark text-white">
        <div className="p-4 text-lg font-bold text-gold">Assuro</div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="block px-4 py-2 text-sm hover:bg-navy">
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
