import { afterEach, describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Button } from './Button'

afterEach(() => cleanup())

describe('Button', () => {
  it('renders with primary variant by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button', { name: /primary/i })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-[#0f1f3d]')
  })

  it('applies secondary variant class', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button', { name: /secondary/i })
    expect(btn.className).toContain('bg-gold')
  })
})
