import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth/context'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Assuro',
  description: 'AI Safety and Governance Assessment Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
