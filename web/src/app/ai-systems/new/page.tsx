'use client'

import { useRouter } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { AISystemForm } from '@/components/ai-systems/AISystemForm'
import { ArrowLeft } from 'lucide-react'

export default function NewAISystemPage() {
  const router = useRouter()

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/ai-systems')}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register AI System</h1>
          <p className="mt-0.5 text-sm text-gray-500">Add a new AI system to your governance inventory</p>
        </div>
      </div>
      <div className="mt-6 max-w-2xl">
        <AISystemForm onSuccess={() => router.push('/ai-systems')} />
      </div>
    </Shell>
  )
}
