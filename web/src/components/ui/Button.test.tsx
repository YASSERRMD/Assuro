import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with primary variant by default', () => {
    render(<Button>Click</Button>)
    const btn = screen.getByRole('button', { name: /click/i })
    expect(btn).toBeInTheDocument()
  })

  it('applies secondary variant class', () => {
    render(<Button variant="secondary">Click</Button>)
    const btn = screen.getByRole('button', { name: /click/i })
    expect(btn.className).toContain('bg-gold')
  })
})
