import { typedFetch } from '@/lib/api'

export interface TestSuite {
  id: string
  name: string
  description: string
  asset_id?: string
  status: string
  created_at: string
  updated_at: string
}

export interface TestCase {
  id: string
  suite_id: string
  name: string
  description: string
  input: string
  expected_output: string
  tags: string[]
  created_at: string
}

export interface TestRun {
  id: string
  suite_id: string
  status: string
  passed: number
  failed: number
  total: number
  started_at: string
  completed_at?: string
}

export async function listTestSuites(): Promise<TestSuite[]> {
  return typedFetch<TestSuite[]>('/v1/test-suites')
}

export async function createTestSuite(data: Partial<TestSuite>): Promise<TestSuite> {
  return typedFetch<TestSuite>('/v1/test-suites', { method: 'POST', body: JSON.stringify(data) })
}

export async function listTestCases(suiteId: string): Promise<TestCase[]> {
  return typedFetch<TestCase[]>(`/v1/test-suites/${suiteId}/cases`)
}

export async function createTestCase(suiteId: string, data: Partial<TestCase>): Promise<TestCase> {
  return typedFetch<TestCase>(`/v1/test-suites/${suiteId}/cases`, { method: 'POST', body: JSON.stringify(data) })
}

export async function listTestRuns(suiteId: string): Promise<TestRun[]> {
  return typedFetch<TestRun[]>(`/v1/test-suites/${suiteId}/runs`)
}

export async function createTestRun(suiteId: string): Promise<TestRun> {
  return typedFetch<TestRun>(`/v1/test-suites/${suiteId}/runs`, { method: 'POST' })
}
