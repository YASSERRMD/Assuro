import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskBadge } from './RiskBadge'

describe('RiskBadge', () => {
  it('renders high risk with red color', () => {
    render(<RiskBadge tier="high" />)
    const badge = screen.getByText('High')
    expect(badge.className).toContain('bg-red-100')
    expect(badge.className).toContain('text-red-800')
  })

  it('renders minimal risk with green color', () => {
    render(<RiskBadge tier="minimal" />)
    const badge = screen.getByText('Minimal')
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-800')
  })

  it('renders unknown tier with gray fallback', () => {
    render(<RiskBadge tier="unknown_tier" />)
    const badge = screen.getByText('unknown_tier')
    expect(badge.className).toContain('bg-gray-100')
    expect(badge.className).toContain('text-gray-600')
  })
})
