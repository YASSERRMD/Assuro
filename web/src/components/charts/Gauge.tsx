interface GaugeProps {
  label: string
  pct: number
  color?: string
}

export function Gauge({ label, pct, color = '#C5A55A' }: GaugeProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="text-lg font-bold fill-navy">{Math.round(pct)}%</text>
      </svg>
      <span className="mt-1 text-xs text-gray-600">{label}</span>
    </div>
  )
}
