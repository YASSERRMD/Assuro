'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { saveResponse, submitAssessment } from '@/lib/api/assessments'

interface Question {
  id: string
  prompt: string
  help_text: string
  answer_type: string
  required: boolean
}

interface RunnerProps {
  assessmentId: string
  questions: Question[]
  onComplete?: () => void
}

export function AssessmentRunner({ assessmentId, questions, onComplete }: RunnerProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSave = async (q: Question, value: unknown): Promise<void> => {
    setSaving(true)
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    try {
      await saveResponse(assessmentId, q.id, value, '')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    setSubmitError('')
    const unanswered = questions.filter((q) => q.required && !answers[q.id])
    if (unanswered.length > 0) {
      setSubmitError(`${unanswered.length} required questions unanswered`)
      return
    }
    try {
      await submitAssessment(assessmentId)
      onComplete?.()
    } catch {
      setSubmitError('Submit failed')
    }
  }

  const renderQuestion = (q: Question): React.ReactNode => {
    const val = answers[q.id]
    if (q.answer_type === 'yesno') {
      return (
        <div className="flex gap-4">
          <label><input type="radio" name={q.id} value="yes" checked={val === 'yes'} onChange={() => handleSave(q, 'yes')} /> Yes</label>
          <label><input type="radio" name={q.id} value="no" checked={val === 'no'} onChange={() => handleSave(q, 'no')} /> No</label>
        </div>
      )
    }
    if (q.answer_type === 'text') {
      return <Input value={(val as string) || ''} onChange={(e) => handleSave(q, e.target.value)} />
    }
    if (q.answer_type === 'number') {
      return <Input type="number" value={(val as string) || ''} onChange={(e) => handleSave(q, e.target.value)} />
    }
    return <Input value={(val as string) || ''} onChange={(e) => handleSave(q, e.target.value)} />
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-gray-200 p-4">
          <p className="font-medium">{i + 1}. {q.prompt} {q.required && <span className="text-red-500">*</span>}</p>
          {q.help_text && <p className="mt-1 text-sm text-gray-500">{q.help_text}</p>}
          <div className="mt-2">{renderQuestion(q)}</div>
          {saving && <span className="text-xs text-gray-400">Saving...</span>}
        </div>
      ))}
      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      <Button onClick={handleSubmit}>Submit Assessment</Button>
    </div>
  )
}
