import { MessageCircle, Paperclip, SquareCheck } from 'lucide-react'
import type { HTMLAttributes, KeyboardEvent } from 'react'

import { DeadlineBadge } from '@/components/pill'
import { PriorityIcon } from '@/components/task-meta'
import { UserAvatar } from '@/components/user-avatar'
import { LabelChip, labelColor, useLabelColors } from '@/features/projects/labels'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/api'

// Thẻ công việc trên Kanban (Figma 03): mã · hạn chót · tiêu đề · nhãn · bộ đếm · người phụ trách
export function TaskCard({ task, onOpen, showProject, dragging, className, ...rest }: {
  task: Task
  onOpen: () => void
  showProject?: boolean
  dragging?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  const colors = useLabelColors()
  const done = task.status === 'DONE'
  const checklistDone = !!task.checklistTotal && task.checklistDone === task.checklistTotal
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${task.project.key}-${task.number}: ${task.title}`}
      {...rest}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className={cn(
        'group bg-card border-border relative cursor-pointer rounded-[10px] border p-3 shadow-card transition-[border-color,box-shadow,transform] duration-150 outline-none',
        'hover:border-border-strong hover:shadow-pop focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        dragging && 'shadow-pop ring-primary/40 rotate-[1.5deg] cursor-grabbing ring-2',
        className,
      )}
    >
      <div className="flex min-h-6 items-center gap-2">
        {showProject && <span className="size-2 shrink-0 rounded-[2px]" style={{ background: task.project.color }} aria-hidden />}
        <span className="text-muted-foreground num text-[13px] font-medium">
          {task.project.key}-{task.number}
        </span>
        <DeadlineBadge
          due={task.dueDate}
          done={done}
          completedAt={task.completedAt}
          hideNone
          className="ml-auto h-[22px] px-1.5"
        />
      </div>

      <p
        className={cn(
          'mt-2 line-clamp-2 text-[15px] leading-snug font-semibold text-foreground',
          done && 'text-text-secondary',
        )}
      >
        {task.title}
      </p>

      {!!task.labels.length && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <LabelChip key={l} name={l} color={labelColor(colors, l)} />
          ))}
          {task.labels.length > 3 && (
            <span className="text-muted-foreground inline-flex h-[22px] items-center px-1 text-xs font-medium">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="text-muted-foreground mt-3 flex items-center gap-3 text-[13px]">
        {!!task.checklistTotal && (
          <span
            className={cn('num inline-flex items-center gap-1', checklistDone && 'text-on-time-foreground font-medium')}
            title="Danh mục kiểm tra"
          >
            <SquareCheck className="size-3.5" strokeWidth={1.8} aria-hidden />
            {task.checklistDone}/{task.checklistTotal}
            <span className="sr-only">mục kiểm tra đã xong</span>
          </span>
        )}
        {!!task.attachmentCount && (
          <span className="num inline-flex items-center gap-1" title="Tệp đính kèm">
            <Paperclip className="size-3.5" strokeWidth={1.8} aria-hidden />
            {task.attachmentCount}
            <span className="sr-only">tệp đính kèm</span>
          </span>
        )}
        {!!task.commentCount && (
          <span className="num inline-flex items-center gap-1" title="Bình luận">
            <MessageCircle className="size-3.5" strokeWidth={1.8} aria-hidden />
            {task.commentCount}
            <span className="sr-only">bình luận</span>
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <PriorityIcon priority={task.priority} />
          {task.assignee ? (
            <UserAvatar user={task.assignee} className="size-6" tooltip />
          ) : (
            <span
              className="border-border-strong grid size-6 place-items-center rounded-full border border-dashed"
              title="Chưa giao"
              aria-label="Chưa giao"
            />
          )}
        </span>
      </div>
    </div>
  )
}
