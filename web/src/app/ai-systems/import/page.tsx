'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { importAISystems } from '@/lib/api/aisystems'

export default function ImportPage() {
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleImport = async (): Promise<void> => {
    setError('')
    setSuccess(false)

    let systems: Record<string, unknown>[]
    try {
      systems = JSON.parse(json)
    } catch {
      setError('Invalid JSON')
      return
    }

    if (!Array.isArray(systems)) {
      setError('Expected a JSON array')
      return
    }

    try {
      await importAISystems(systems)
      setSuccess(true)
      setTimeout(() => router.push('/ai-systems'), 1500)
    } catch {
      setError('Import failed')
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Bulk Import</h1>
      <p className="mt-2 text-sm text-gray-500">Paste a JSON array of AI systems to import.</p>
      <textarea
        className="mt-4 w-full rounded-md border border-gray-300 p-3 font-mono text-sm"
        rows={10}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='[{"name": "System 1", "provider": "internal"}]'
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">Import successful! Redirecting...</p>}
      <Button onClick={handleImport} className="mt-4">Import</Button>
    </Shell>
  )
}
