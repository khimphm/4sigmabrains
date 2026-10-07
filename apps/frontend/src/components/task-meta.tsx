import { CalendarClock } from 'lucide-react'

import { PRIORITY_META, STATUS_META } from '@/lib/constants'
import { dueLabel, isOverdue } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TaskPriority, TaskStatus } from '@/types/api'

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', meta.badge, className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function StatusDot({ status }: { status: TaskStatus }) {
  return <span className={cn('inline-block size-2 rounded-full', STATUS_META[status].dot)} />
}

// Biểu tượng cột tín hiệu cho độ ưu tiên
export function PriorityIcon({ priority, withLabel, className }: { priority: TaskPriority; withLabel?: boolean; className?: string }) {
  const meta = PRIORITY_META[priority]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', meta.color, className)} title={`Ưu tiên: ${meta.label}`}>
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((b) => (
          <span
            key={b}
            className={cn('w-[3px] rounded-sm', b <= meta.bars ? 'bg-current' : 'bg-current opacity-20')}
            style={{ height: `${b * 25}%` }}
          />
        ))}
      </span>
      {withLabel ? <span className="text-foreground">{meta.label}</span> : <span className="sr-only">Ưu tiên {meta.label}</span>}
    </span>
  )
}

export function DueDate({ due, done, className }: { due: string | null; done?: boolean; className?: string }) {
  const label = dueLabel(due, done)
  if (!label) return null
  const overdue = isOverdue(due, done)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        overdue ? 'text-overdue-foreground font-semibold' : 'text-muted-foreground',
        className,
      )}
    >
      <CalendarClock className="size-3.5" strokeWidth={1.8} aria-hidden />
      {label}
    </span>
  )
}
