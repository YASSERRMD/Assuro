interface CardProps {
  children: React.ReactNode
  className?: string
}

/** Card wraps content in a white rounded panel with a shadow. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm ${className}`}>{children}</div>
  )
}
