import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Gauge } from './Gauge'

describe('Gauge', () => {
  it('renders with correct label', () => {
    render(<Gauge label="Test Framework" pct={75} />)
    expect(screen.getByText('Test Framework')).toBeInTheDocument()
  })

  it('displays percentage', () => {
    render(<Gauge label="Test" pct={50} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
