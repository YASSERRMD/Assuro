const tierStyles: Record<string, string> = {
  unacceptable: 'bg-black text-white',
  high: 'bg-red-100 text-red-800',
  limited: 'bg-orange-100 text-orange-800',
  minimal: 'bg-green-100 text-green-800',
  unknown: 'bg-gray-100 text-gray-600',
}

const tierLabels: Record<string, string> = {
  unacceptable: 'Unacceptable',
  high: 'High',
  limited: 'Limited',
  minimal: 'Minimal',
  unknown: 'Unknown',
}

interface RiskBadgeProps {
  tier: string
}

export function RiskBadge({ tier }: RiskBadgeProps) {
  const key = tier?.toLowerCase() || 'unknown'
  const style = tierStyles[key] ?? tierStyles.unknown
  const label = tierLabels[key] ?? tier
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
