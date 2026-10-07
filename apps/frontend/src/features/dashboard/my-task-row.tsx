import { CheckSquare, MessageSquare, Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DeadlineBadge } from '@/components/pill'
import { PriorityIcon } from '@/components/task-meta'
import { Checkbox } from '@/components/ui/checkbox'
import { STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/api'
import { useToggleTaskDone } from './api'
import { ProjectDot } from './section-card'

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-semibold whitespace-nowrap', meta.badge, className)}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function TaskDoneCheckbox({ task, className }: { task: Pick<Task, 'id' | 'title' | 'status' | 'number' | 'project'>; className?: string }) {
  const toggle = useToggleTaskDone()
  const done = task.status === 'DONE'
  return (
    <Checkbox
      checked={done}
      onCheckedChange={(v) =>
        toggle.mutate({
          id: task.id,
          status: v ? 'DONE' : 'TODO',
          code: `${task.project.key}-${task.number}`,
          prevStatus: task.status,
        })
      }
      onClick={(e) => e.stopPropagation()}
      aria-label={done ? `Mở lại việc ${task.title}` : `Đánh dấu hoàn thành: ${task.title}`}
      className={cn('size-[18px] cursor-pointer', className)}
    />
  )
}

// Dòng việc trong danh sách "Việc của tôi"
export function MyTaskRow({ task }: { task: Task }) {
  const done = task.status === 'DONE'
  const code = `${task.project.key}-${task.number}`
  return (
    <li className="group flex items-center gap-3 px-4 py-2.5 sm:px-5">
      <TaskDoneCheckbox task={task} />
      <Link
        to={`/tasks/${task.id}`}
        className="hover:bg-subtle focus-visible:ring-ring/50 -my-1 -mr-2 flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md px-2 py-1.5 transition-colors duration-150 outline-none focus-visible:ring-[3px] sm:flex-nowrap"
      >
        <span className="flex min-w-0 flex-1 basis-full items-start gap-2.5 sm:basis-auto sm:items-center">
          <PriorityIcon priority={task.priority} className="mt-1 shrink-0 sm:mt-0" />
          <span className="text-muted-foreground num mt-px shrink-0 text-[13px] font-medium sm:mt-0 sm:w-16">{code}</span>
          <span className={cn('line-clamp-2 min-w-0 text-[15px] font-semibold sm:line-clamp-1', done && 'text-muted-foreground line-through')}>{task.title}</span>
        </span>
        <span className="text-muted-foreground flex shrink-0 items-center gap-2.5 text-[12px] max-sm:pl-[26px]">
          {!!task.checklistTotal && (
            <span className="num hidden items-center gap-1 md:inline-flex" title="Danh sách kiểm tra">
              <CheckSquare className="size-3.5" strokeWidth={1.8} aria-hidden />
              {task.checklistDone ?? 0}/{task.checklistTotal}
            </span>
          )}
          {!!task.commentCount && (
            <span className="num hidden items-center gap-1 md:inline-flex" title="Bình luận">
              <MessageSquare className="size-3.5" strokeWidth={1.8} aria-hidden />
              {task.commentCount}
            </span>
          )}
          {!!task.attachmentCount && (
            <span className="num hidden items-center gap-1 lg:inline-flex" title="Tệp đính kèm">
              <Paperclip className="size-3.5" strokeWidth={1.8} aria-hidden />
              {task.attachmentCount}
            </span>
          )}
          <span className="bg-subtle text-text-secondary hidden h-6 max-w-40 items-center gap-1.5 rounded-md px-2 font-medium md:inline-flex">
            <ProjectDot color={task.project.color} />
            <span className="truncate">{task.project.name}</span>
          </span>
          <StatusPill status={task.status} />
          <DeadlineBadge due={task.dueDate} done={done} completedAt={task.completedAt} className="min-w-[7.5rem] justify-center" />
        </span>
      </Link>
    </li>
  )
}

// Thẻ việc trên bảng theo trạng thái
export function MyTaskCard({ task }: { task: Task }) {
  const done = task.status === 'DONE'
  return (
    <li className="bg-card shadow-card hover:border-border-strong relative rounded-lg border p-3 transition-colors duration-150">
      <div className="flex items-start gap-2.5">
        <TaskDoneCheckbox task={task} className="relative z-10 mt-0.5" />
        <Link
          to={`/tasks/${task.id}`}
          className="min-w-0 flex-1 outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
        >
          <span className={cn('line-clamp-2 text-[14px] leading-5 font-semibold', done && 'text-muted-foreground line-through')}>{task.title}</span>
        </Link>
      </div>
      <div className="text-muted-foreground mt-2 flex items-center gap-1.5 pl-[28px] text-[12px]">
        <ProjectDot color={task.project.color} />
        <span className="num font-medium">
          {task.project.key}-{task.number}
        </span>
        <span className="truncate">· {task.project.name}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 pl-[28px]">
        <DeadlineBadge due={task.dueDate} done={done} completedAt={task.completedAt} />
        <PriorityIcon priority={task.priority} />
      </div>
    </li>
  )
}
