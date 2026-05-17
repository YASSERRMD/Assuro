'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

const PUBLIC_PATHS = ['/login', '/signup', '/']

interface RouteGuardProps {
  children: React.ReactNode
}

/** RouteGuard redirects unauthenticated users to /login for protected routes. */
export function RouteGuard({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (!user && !isPublic) {
      router.replace('/login')
    }
  }, [user, isLoading, pathname, router])

  // Show nothing while checking auth to avoid flash of protected content.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
