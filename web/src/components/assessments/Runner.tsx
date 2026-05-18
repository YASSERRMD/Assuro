'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { saveResponse, submitAssessment } from '@/lib/api/assessments'
import { CheckCircle2, AlertCircle, ChevronRight, Loader2 } from 'lucide-react'

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

function YesNoField({ id, value, onChange }: { id: string; value: unknown; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {(['yes', 'no'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex h-10 w-20 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
            value === opt
              ? 'border-[#0f1f3d] bg-[#0f1f3d] text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  )
}

export function AssessmentRunner({ assessmentId, questions, onComplete }: RunnerProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const answered = Object.keys(answers).filter((k) => answers[k] !== '' && answers[k] !== undefined).length
  const required = questions.filter((q) => q.required).length
  const requiredAnswered = questions.filter((q) => q.required && answers[q.id]).length
  const progress = required > 0 ? (requiredAnswered / required) * 100 : 100

  const handleSave = async (q: Question, value: unknown): Promise<void> => {
    setSavingId(q.id)
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    try {
      await saveResponse(assessmentId, q.id, value, '')
    } finally {
      setSavingId(null)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    setSubmitError('')
    const unanswered = questions.filter((q) => q.required && !answers[q.id])
    if (unanswered.length > 0) {
      setSubmitError(`${unanswered.length} required question${unanswered.length > 1 ? 's' : ''} still need${unanswered.length === 1 ? 's' : ''} an answer`)
      return
    }
    setSubmitting(true)
    try {
      await submitAssessment(assessmentId)
      onComplete?.()
    } catch {
      setSubmitError('Submit failed - please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const renderControl = (q: Question): React.ReactNode => {
    const val = answers[q.id]
    if (q.answer_type === 'yesno') {
      return <YesNoField id={q.id} value={val} onChange={(v) => handleSave(q, v)} />
    }
    if (q.answer_type === 'number') {
      return (
        <Input
          type="number"
          value={(val as string) || ''}
          onChange={(e) => handleSave(q, e.target.value)}
          className="max-w-xs"
        />
      )
    }
    return (
      <textarea
        value={(val as string) || ''}
        onChange={(e) => handleSave(q, e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0f1f3d] focus:ring-1 focus:ring-[#0f1f3d]/30"
        placeholder="Enter your response…"
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {answered} of {questions.length} answered
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {required - requiredAnswered} required question{required - requiredAnswered !== 1 ? 's' : ''} remaining
            </p>
          </div>
          <span className="text-sm font-semibold text-[#0f1f3d]">{Math.round(progress)}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#0f1f3d] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, i) => {
        const isAnswered = !!answers[q.id]
        const isSaving = savingId === q.id
        return (
          <div
            key={q.id}
            className={`rounded-xl border bg-white shadow-sm transition-colors ${
              isAnswered ? 'border-emerald-100' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-3 border-b border-gray-50 px-5 py-4">
              <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                isAnswered
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}>
                {isAnswered ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {q.prompt}
                  {q.required && <span className="ml-1 text-red-400">*</span>}
                </p>
                {q.help_text && (
                  <p className="mt-0.5 text-xs text-gray-400">{q.help_text}</p>
                )}
              </div>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-300" />}
            </div>
            <div className="px-5 py-4">
              {renderControl(q)}
            </div>
          </div>
        )
      })}

      {/* Submit bar */}
      <div className="sticky bottom-4 rounded-xl border border-gray-100 bg-white p-4 shadow-md">
        {submitError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            All required questions must be answered before submitting
          </p>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
            ) : (
              <>Submit Assessment <ChevronRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
