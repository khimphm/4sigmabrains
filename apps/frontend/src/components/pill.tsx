import type { LucideIcon } from 'lucide-react'
import { Clock } from 'lucide-react'
import type { ReactNode } from 'react'

import { deadlineState, TONE_CLASS, type DeadlineTone } from '@/lib/deadline'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

// Nhãn nhỏ theo bộ màu trạng thái của Figma (Badge 12 SemiBold)
export function Pill({
  tone = 'neutral',
  icon: Icon,
  children,
  className,
  title,
}: {
  tone?: DeadlineTone | 'primary' | 'seal'
  icon?: LucideIcon
  children: ReactNode
  className?: string
  title?: string
}) {
  const toneClass =
    tone === 'primary' ? 'bg-primary-soft text-primary' : tone === 'seal' ? 'bg-seal text-white' : TONE_CLASS[tone]
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap',
        toneClass,
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  )
}

export function DeadlineBadge({
  due,
  done,
  completedAt,
  className,
  hideNone,
}: {
  due: string | null | undefined
  done?: boolean
  completedAt?: string | null
  className?: string
  hideNone?: boolean
}) {
  if (!due && hideNone) return null
  const s = deadlineState(due, { done, completedAt })
  return (
    <Pill tone={s.tone} icon={Clock} className={className} title={due ? `Hạn chót: ${fmtDateTime(due)}` : undefined}>
      {s.label}
    </Pill>
  )
}

const DOT_CLASS: Record<DeadlineTone, string> = {
  overdue: 'bg-overdue-foreground',
  'due-soon': 'bg-due-soon-foreground',
  'on-time': 'bg-on-time-foreground',
  late: 'bg-late-foreground',
  neutral: 'bg-neutral-foreground',
}

export function DeadlineLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs', className)}>
      {(
        [
          ['overdue', 'Quá hạn'],
          ['due-soon', 'Sắp đến hạn'],
          ['on-time', 'Đúng hạn'],
          ['late', 'Trễ hạn'],
        ] as const
      ).map(([tone, label]) => (
        <span key={tone} className="text-muted-foreground inline-flex items-center gap-1.5">
          <span className={cn('size-2.5 rounded-full', DOT_CLASS[tone])} />
          {label}
        </span>
      ))}
    </div>
  )
}
