import { CheckSquare, MessageSquare } from 'lucide-react'
import type { HTMLAttributes } from 'react'

import { DueDate, PriorityIcon } from '@/components/task-meta'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/api'

export function TaskCard({ task, onOpen, showProject, dragging, className, ...rest }: {
  task: Task
  onOpen: () => void
  showProject?: boolean
  dragging?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  const done = task.status === 'DONE'
  return (
    <div
      {...rest}
      onClick={onOpen}
      className={cn(
        'bg-card group cursor-pointer rounded-lg border p-3 shadow-xs transition-all hover:border-primary/30 hover:shadow-md',
        dragging && 'rotate-2 shadow-xl ring-2 ring-primary/30',
        className,
      )}
    >
      <div className="text-muted-foreground mb-1.5 flex items-center gap-2 text-[11px]">
        {showProject && <span className="size-2 rounded-[2px]" style={{ background: task.project.color }} />}
        <span className="font-mono">
          {task.project.key}-{task.number}
        </span>
        <PriorityIcon priority={task.priority} className="ml-auto" />
      </div>
      <p className={cn('text-sm leading-snug font-medium', done && 'text-muted-foreground line-through')}>{task.title}</p>
      {!!task.labels.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <span key={l} className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <DueDate due={task.dueDate} done={done} />
        {!!task.checklistTotal && (
          <span className={cn('text-muted-foreground inline-flex items-center gap-1 text-xs', task.checklistDone === task.checklistTotal && 'text-emerald-600')}>
            <CheckSquare className="size-3.5" />
            {task.checklistDone}/{task.checklistTotal}
          </span>
        )}
        <span className="ml-auto">
          {task.assignee ? (
            <UserAvatar user={task.assignee} className="size-6" tooltip />
          ) : (
            <span className="text-muted-foreground grid size-6 place-items-center rounded-full border border-dashed">
              <MessageSquare className="size-3 opacity-0" />
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
