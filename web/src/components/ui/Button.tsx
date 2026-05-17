import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors'
  const variants = {
    primary: 'bg-navy text-white hover:bg-navy-dark',
    secondary: 'bg-gold text-navy-dark hover:opacity-90',
    ghost: 'text-navy hover:bg-light',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
}
