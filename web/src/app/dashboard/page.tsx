'use client'

import { Shell } from '@/components/shell/Shell'

export default function DashboardPage() {
  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to Assuro. Select a section from the navigation to get started.</p>
    </Shell>
  )
}
