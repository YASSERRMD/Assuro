'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { AssessmentRunner } from '@/components/assessments/Runner'
import {
  getAssessment,
  getAssessmentQuestions,
  getAssessmentResponses,
  type Assessment,
  type Question,
  type AssessmentResponseItem,
} from '@/lib/api/assessments'
import { CheckCircle2 } from 'lucide-react'

function formatAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) return '—'
  if (typeof answer === 'boolean') return answer ? 'Yes' : 'No'
  if (typeof answer === 'string') return answer || '—'
  if (typeof answer === 'number') return String(answer)
  return JSON.stringify(answer)
}

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<AssessmentResponseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('')

  useEffect(() => {
    params.then(async (p) => {
      setId(p.id)
      const [a, qs] = await Promise.all([
        getAssessment(p.id),
        getAssessmentQuestions(p.id),
      ])
      setAssessment(a)
      setQuestions(qs)

      if (a.status === 'completed') {
        const rs = await getAssessmentResponses(p.id).catch(() => [])
        setResponses(rs)
      }

      setLoading(false)
    })
  }, [params])

  if (loading) return <Shell><p className="mt-4 text-gray-500">Loading...</p></Shell>
  if (!assessment) return <Shell><p className="mt-4 text-red-500">Assessment not found.</p></Shell>

  const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]))

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Assessment</h1>
        <Badge
          variant={
            assessment.status === 'completed'
              ? 'success'
              : assessment.status === 'in_review'
              ? 'warning'
              : 'default'
          }
        >
          {assessment.status.replace('_', ' ')}
        </Badge>
      </div>
      <p className="mt-1 font-mono text-xs text-gray-400">{assessment.id}</p>

      {assessment.status === 'completed' ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Assessment completed</p>
              <p className="text-sm text-emerald-600">
                {assessment.completed_at
                  ? new Date(assessment.completed_at).toLocaleString()
                  : 'Completion date unavailable'}
              </p>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="card p-6 text-center text-sm text-gray-400">
              No saved responses found for this assessment.
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-sm font-semibold text-gray-700">Responses</h2>
                <span className="text-xs text-gray-400">{responses.length} answered</span>
              </div>
              <div className="divide-y divide-gray-50">
                {responses.map((resp, idx) => {
                  const question = questionMap[resp.question_id]
                  return (
                    <div key={resp.question_id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1B2A4A]/10 text-[10px] font-bold text-[#1B2A4A]">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-snug">
                            {question?.prompt ?? `Question ${resp.question_id.slice(0, 8)}…`}
                          </p>
                          {question?.help_text && (
                            <p className="mt-0.5 text-xs text-gray-400">{question.help_text}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-[#1B2A4A]/8 px-2.5 py-0.5 text-xs font-semibold text-[#1B2A4A]">
                              {formatAnswer(resp.answer)}
                            </span>
                            {resp.note && (
                              <span className="text-xs text-gray-400 italic">Note: {resp.note}</span>
                            )}
                          </div>
                        </div>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 max-w-2xl">
          {questions.length === 0 ? (
            <p className="text-sm text-gray-500">No questions found for this assessment template.</p>
          ) : (
            <AssessmentRunner
              assessmentId={id}
              questions={questions}
              onComplete={() => router.push('/assessments')}
            />
          )}
        </div>
      )}
    </Shell>
  )
}
