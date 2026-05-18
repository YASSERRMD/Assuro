import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600 ring-gray-200/60',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  danger: 'bg-red-50 text-red-700 ring-red-200/60',
  info: 'bg-blue-50 text-blue-700 ring-blue-200/60',
  outline: 'bg-transparent text-gray-600 ring-gray-200',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  )
}
