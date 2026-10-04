import { DueDate, PriorityIcon, StatusBadge } from '@/components/task-meta'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/api'

export function TaskTable({ tasks, onOpen, showProject }: { tasks: Task[]; onOpen: (t: Task) => void; showProject?: boolean }) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="text-muted-foreground hidden grid-cols-[90px_1fr_130px_110px_150px_120px] gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid">
        <span>Mã</span>
        <span>Công việc</span>
        <span>Trạng thái</span>
        <span>Ưu tiên</span>
        <span>Người làm</span>
        <span>Hạn chót</span>
      </div>
      {tasks.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onOpen(t)}
          className="hover:bg-muted/50 grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b px-4 py-3 text-left transition-colors last:border-0 md:grid-cols-[90px_1fr_130px_110px_150px_120px]"
        >
          <span className="text-muted-foreground hidden items-center gap-2 font-mono text-xs md:flex">
            {showProject && <span className="size-2 rounded-[2px]" style={{ background: t.project.color }} />}
            {t.project.key}-{t.number}
          </span>
          <span className={cn('truncate text-sm font-medium', t.status === 'DONE' && 'text-muted-foreground line-through')}>
            {t.title}
          </span>
          <span>
            <StatusBadge status={t.status} />
          </span>
          <span className="hidden md:block">
            <PriorityIcon priority={t.priority} withLabel />
          </span>
          <span className="hidden items-center gap-2 text-sm md:flex">
            {t.assignee ? (
              <>
                <UserAvatar user={t.assignee} className="size-6" />
                <span className="truncate">{t.assignee.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Chưa giao</span>
            )}
          </span>
          <span className="hidden md:block">
            <DueDate due={t.dueDate} done={t.status === 'DONE'} />
          </span>
        </button>
      ))}
    </div>
  )
}
