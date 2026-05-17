import { typedFetch } from '@/lib/api'

export interface Assessment {
  id: string
  org_id: string
  asset_id: string
  template_id: string
  status: string
  created_at: string
  completed_at?: string
}

export interface Question {
  id: string
  prompt: string
  help_text: string
  answer_type: string
  required: boolean
}

export async function listAssessments(): Promise<Assessment[]> {
  return typedFetch<Assessment[]>('/v1/assessments')
}

export async function createAssessment(assetId: string, templateId: string): Promise<Assessment> {
  return typedFetch<Assessment>('/v1/assessments', {
    method: 'POST',
    body: JSON.stringify({ asset_id: assetId, template_id: templateId }),
  })
}

export async function saveResponse(assessmentId: string, questionId: string, answer: unknown, note: string): Promise<void> {
  await typedFetch(`/v1/assessments/${assessmentId}/responses`, {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, answer, note }),
  })
}

export async function submitAssessment(assessmentId: string): Promise<void> {
  await typedFetch(`/v1/assessments/${assessmentId}/submit`, { method: 'POST' })
}

export async function getAssessment(id: string): Promise<Assessment> {
  return typedFetch<Assessment>(`/v1/assessments/${id}`)
}

export async function getAssessmentQuestions(id: string): Promise<Question[]> {
  return typedFetch<Question[]>(`/v1/assessments/${id}/questions`)
}
