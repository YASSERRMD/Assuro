import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: 'navy' | 'red' | 'orange' | 'green' | 'blue'
  subtext?: string
}

const accentMap = {
  navy: { bg: 'bg-[#0f1f3d]/8', icon: 'text-[#0f1f3d]', value: 'text-[#0f1f3d]', ring: 'ring-[#0f1f3d]/15' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-700', ring: 'ring-red-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-700', ring: 'ring-orange-200' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700', ring: 'ring-emerald-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700', ring: 'ring-blue-200' },
}

export function StatCard({ label, value, icon: Icon, accent = 'navy', subtext }: StatCardProps) {
  const colors = accentMap[accent]

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${colors.bg} ${colors.ring}`}>
          <Icon className={`h-4.5 w-4.5 ${colors.icon}`} size={18} />
        </div>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${colors.value}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
    </div>
  )
}
