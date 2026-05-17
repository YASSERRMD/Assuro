import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskBadge } from './RiskBadge'

describe('RiskBadge', () => {
  it('renders high risk with orange color', () => {
    render(<RiskBadge tier="high" />)
    const badge = screen.getByText('high')
    expect(badge.className).toContain('bg-orange-500')
  })

  it('renders minimal risk with green color', () => {
    render(<RiskBadge tier="minimal" />)
    const badge = screen.getByText('minimal')
    expect(badge.className).toContain('bg-green-500')
  })

  it('renders unknown tier with gray color', () => {
    render(<RiskBadge tier="unknown_tier" />)
    const badge = screen.getByText('unknown_tier')
    expect(badge.className).toContain('bg-gray-300')
  })
})
