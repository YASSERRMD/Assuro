'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { registerAISystem } from '@/lib/api/aisystems'

interface AISystemFormProps {
  onSuccess?: () => void
}

export function AISystemForm({ onSuccess }: AISystemFormProps) {
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [purpose, setPurpose] = useState('')
  const [modality, setModality] = useState('')
  const [euExposure, setEuExposure] = useState(false)
  const [isAgentic, setIsAgentic] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    try {
      await registerAISystem({
        name, provider, intended_purpose: purpose,
        modality, eu_market_exposure: euExposure, is_agentic: isAgentic,
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
      <Input label="Intended Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      <Input label="Modality" value={modality} onChange={(e) => setModality(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={euExposure} onChange={(e) => setEuExposure(e.target.checked)} />
        EU Market Exposure
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isAgentic} onChange={(e) => setIsAgentic(e.target.checked)} />
        Agentic Behavior
      </label>
      <Button type="submit">Register</Button>
    </form>
  )
}
