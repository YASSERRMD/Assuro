import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setToken, typedFetch } from '@/lib/api'

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
})

describe('API client', () => {
  it('sets token in localStorage', () => {
    setToken('test-token')
    expect(localStorage.setItem).toHaveBeenCalledWith('assuro_token', 'test-token')
  })
})
