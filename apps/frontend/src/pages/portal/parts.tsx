import type { ReactNode } from 'react'

import { PROJECT_STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/api'

// Vòng tiến độ (SVG) có số % ở giữa
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color = 'var(--color-primary)',
  label,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  label?: ReactNode
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }} role="img" aria-label={`Tiến độ ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num leading-none font-extrabold tracking-tight" style={{ fontSize: size * 0.24 }}>
            {pct}%
          </div>
          {label && <div className="text-muted-foreground mt-1 text-[11px] font-semibold">{label}</div>}
        </div>
      </div>
    </div>
  )
}

export function ProgressBar({ value, color, className }: { value: number; color?: string; className?: string }) {
  return (
    <div
      className={cn('bg-subtle h-2 overflow-hidden rounded-full border', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${value}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  )
}

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status]
  return <span className={cn('inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold whitespace-nowrap', meta.badge)}>{meta.label}</span>
}
