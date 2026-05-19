'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { AssessmentRunner } from '@/components/assessments/Runner'
import { getAssessment, getAssessmentQuestions, type Assessment, type Question } from '@/lib/api/assessments'

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
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
      setLoading(false)
    })
  }, [params])

  if (loading) return <Shell><p className="mt-4 text-gray-500">Loading...</p></Shell>
  if (!assessment) return <Shell><p className="mt-4 text-red-500">Assessment not found.</p></Shell>

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-navy">Assessment</h1>
        <Badge variant={assessment.status === 'completed' ? 'success' : assessment.status === 'in_review' ? 'warning' : 'default'}>
          {assessment.status.replace('_', ' ')}
        </Badge>
      </div>
      <p className="mt-1 font-mono text-xs text-gray-400">{assessment.id}</p>

      {assessment.status === 'completed' ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">Assessment completed</p>
          <p className="text-sm text-green-700">
            Completed on {assessment.completed_at ? new Date(assessment.completed_at).toLocaleString() : 'unknown'}
          </p>
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
