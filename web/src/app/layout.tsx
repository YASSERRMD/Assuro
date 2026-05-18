import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth/context'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { ToastProvider } from '@/components/ui/Toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Assuro',
  description: 'AI Safety and Governance Assessment Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <RouteGuard>{children}</RouteGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
