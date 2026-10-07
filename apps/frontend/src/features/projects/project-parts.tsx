import { differenceInCalendarDays } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

import { Pill } from '@/components/pill'
import { PROJECT_STATUS_META } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/api'
import { projectPct } from './project-utils'

const STATUS_TONE: Record<ProjectStatus, 'primary' | 'due-soon' | 'on-time' | 'neutral'> = {
  ACTIVE: 'primary',
  ON_HOLD: 'due-soon',
  COMPLETED: 'on-time',
  ARCHIVED: 'neutral',
}

export function ProjectStatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <Pill tone={STATUS_TONE[status]} className={className}>
      {PROJECT_STATUS_META[status].label}
    </Pill>
  )
}

// Ô vuông màu dự án + mã viết tắt
export function ProjectMark({ project, className }: { project: Pick<Project, 'key' | 'color'>; className?: string }) {
  return (
    <span
      className={cn('grid size-10 shrink-0 place-items-center rounded-md text-[13px] font-bold tracking-wide text-white', className)}
      style={{ background: project.color }}
      aria-hidden
    >
      {project.key.slice(0, 3)}
    </span>
  )
}

export function ProjectProgress({ project, className, showLabel = true }: {
  project: Pick<Project, 'stats' | 'color'>
  className?: string
  showLabel?: boolean
}) {
  const pct = projectPct(project)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="bg-subtle h-1.5 flex-1 overflow-hidden rounded-full border border-border/50"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Tiến độ ${pct}%`}
      >
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: project.color }} />
      </div>
      {showLabel && <span className="num w-9 text-right text-[13px] font-semibold">{pct}%</span>}
    </div>
  )
}

// Hạn dự án: có chữ cho trạng thái (quá hạn / còn n ngày)
export function ProjectDue({ project, className }: { project: Pick<Project, 'dueDate' | 'status'>; className?: string }) {
  const [now] = useState(() => new Date())
  if (!project.dueDate) return <span className={cn('text-muted-foreground text-[13px]', className)}>Chưa đặt hạn</span>
  const days = differenceInCalendarDays(new Date(project.dueDate), now)
  const closed = project.status === 'COMPLETED' || project.status === 'ARCHIVED'
  const hint = closed ? null : days < 0 ? `trễ ${-days} ngày` : days === 0 ? 'hôm nay' : days <= 14 ? `còn ${days} ngày` : null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[13px]',
        !closed && days < 0 ? 'text-overdue-foreground font-semibold' : !closed && days <= 14 ? 'text-due-soon-foreground font-medium' : 'text-text-secondary',
        className,
      )}
    >
      <CalendarDays className="size-3.5" strokeWidth={1.8} aria-hidden />
      Hạn {fmtDate(project.dueDate)}
      {hint && <span>· {hint}</span>}
    </span>
  )
}
