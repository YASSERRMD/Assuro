interface RiskBadgeProps {
  tier: string
}

const tierColors: Record<string, string> = {
  unacceptable: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  limited: 'bg-yellow-400 text-navy-dark',
  minimal: 'bg-green-500 text-white',
}

export function RiskBadge({ tier }: RiskBadgeProps) {
  const color = tierColors[tier] || 'bg-gray-300 text-gray-700'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {tier || 'unknown'}
    </span>
  )
}
