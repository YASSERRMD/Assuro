'use client'

import { useRouter } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { AISystemForm } from '@/components/ai-systems/AISystemForm'

export default function NewAISystemPage() {
  const router = useRouter()

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Register AI System</h1>
      <div className="mt-4 max-w-lg">
        <AISystemForm onSuccess={() => router.push('/ai-systems')} />
      </div>
    </Shell>
  )
}
