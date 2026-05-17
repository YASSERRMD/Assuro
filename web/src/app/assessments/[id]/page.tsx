'use client'

import { Shell } from '@/components/shell/Shell'
import { AssessmentRunner } from '@/components/assessments/Runner'
import { useRouter } from 'next/navigation'

const mockQuestions = [
  { id: 'q1', prompt: 'Has a risk management system been established?', help_text: 'Document your approach', answer_type: 'yesno', required: true },
  { id: 'q2', prompt: 'Are training data sources documented?', help_text: 'Include data provenance', answer_type: 'yesno', required: true },
  { id: 'q3', prompt: 'What is the intended purpose?', help_text: '', answer_type: 'text', required: false },
]

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Assessment</h1>
      <div className="mt-4 max-w-2xl">
        <AssessmentRunner assessmentId="mock-id" questions={mockQuestions} onComplete={() => router.push('/assessments')} />
      </div>
    </Shell>
  )
}
