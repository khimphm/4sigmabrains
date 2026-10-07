import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type StatTone = 'default' | 'danger' | 'success' | 'warning' | 'late' | 'primary'

const VALUE_TONE: Record<StatTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  danger: 'text-overdue-foreground',
  warning: 'text-due-soon-foreground',
  success: 'text-on-time-foreground',
  late: 'text-late-foreground',
}

const ICON_TONE: Record<StatTone, string> = {
  default: 'bg-subtle text-text-secondary',
  primary: 'bg-primary-soft text-primary',
  danger: 'bg-overdue text-overdue-foreground',
  warning: 'bg-due-soon text-due-soon-foreground',
  success: 'bg-on-time text-on-time-foreground',
  late: 'bg-late text-late-foreground',
}

// Thẻ số liệu theo Figma: nhãn 13 SemiBold, số 32 ExtraBold, dòng gợi ý
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
  onClick,
  className,
}: {
  icon?: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: StatTone
  onClick?: () => void
  className?: string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-text-secondary text-[13px] leading-5 font-semibold">{label}</span>
        {Icon && (
          <span className={cn('grid size-7 shrink-0 place-items-center rounded-md', ICON_TONE[tone])} aria-hidden>
            <Icon className="size-4" strokeWidth={1.8} />
          </span>
        )}
      </div>
      <div className={cn('num mt-1 text-[32px] leading-10 font-extrabold tracking-tight', VALUE_TONE[tone])}>{value}</div>
      {hint && <div className="text-muted-foreground mt-1.5 line-clamp-2 text-[13px] leading-5">{hint}</div>}
    </>
  )
  const base = 'bg-card shadow-card block min-w-0 rounded-[10px] border px-5 py-4 text-left'
  if (!onClick) return <div className={cn(base, className)}>{body}</div>
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        'hover:border-border-strong focus-visible:ring-ring/50 cursor-pointer transition-[border-color,box-shadow,transform] duration-200 outline-none hover:-translate-y-px hover:shadow-md focus-visible:ring-[3px] motion-reduce:transform-none',
        className,
      )}
    >
      {body}
    </button>
  )
}
