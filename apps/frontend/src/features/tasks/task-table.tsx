import { ArrowDown, ArrowUp, ChevronsUpDown, MessageCircle, Paperclip, SquareCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DeadlineBadge } from '@/components/pill'
import { PriorityIcon, StatusBadge } from '@/components/task-meta'
import { UserAvatar } from '@/components/user-avatar'
import { LabelChip } from '@/features/projects/labels'
import { labelColor, useLabelColors } from '@/features/projects/project-utils'
import { PRIORITIES, TASK_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/api'

type SortKey = 'code' | 'title' | 'status' | 'priority' | 'assignee' | 'due'

const COLS = 'md:grid-cols-[96px_minmax(0,1fr)_128px_112px_170px_140px]'

const compare: Record<SortKey, (a: Task, b: Task) => number> = {
  code: (a, b) => a.project.key.localeCompare(b.project.key) || a.number - b.number,
  title: (a, b) => a.title.localeCompare(b.title, 'vi'),
  status: (a, b) => TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status),
  priority: (a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority),
  assignee: (a, b) => (a.assignee?.name ?? '~').localeCompare(b.assignee?.name ?? '~', 'vi'),
  due: (a, b) => (a.dueDate ? +new Date(a.dueDate) : Infinity) - (b.dueDate ? +new Date(b.dueDate) : Infinity),
}

function HeadCell({ k, label, sort, onSort }: {
  k: SortKey
  label: string
  sort: { key: SortKey; dir: 1 | -1 } | null
  onSort: (k: SortKey) => void
}) {
  const active = sort?.key === k
  const Icon = !active ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'hover:text-foreground focus-visible:ring-ring/50 -mx-1 flex cursor-pointer items-center gap-1 rounded px-1 text-left transition-colors outline-none focus-visible:ring-2',
        active && 'text-foreground',
      )}
    >
      {label}
      <Icon className={cn('size-3.5', !active && 'opacity-40')} aria-hidden />
    </button>
  )
}

export function TaskTable({ tasks, onOpen, showProject }: { tasks: Task[]; onOpen: (t: Task) => void; showProject?: boolean }) {
  const colors = useLabelColors()
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)
  const onSort = (key: SortKey) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null))
  const rows = useMemo(
    () => (sort ? [...tasks].sort((a, b) => compare[sort.key](a, b) * sort.dir) : tasks),
    [tasks, sort],
  )

  return (
    <div className="bg-card shadow-card overflow-hidden rounded-[10px] border">
      <div
        className={cn(
          'text-muted-foreground bg-subtle hidden gap-4 border-b px-4 py-2.5 text-[13px] font-semibold md:grid',
          COLS,
        )}
      >
        <HeadCell k="code" label="Mã" sort={sort} onSort={onSort} />
        <HeadCell k="title" label="Công việc" sort={sort} onSort={onSort} />
        <HeadCell k="status" label="Trạng thái" sort={sort} onSort={onSort} />
        <HeadCell k="priority" label="Ưu tiên" sort={sort} onSort={onSort} />
        <HeadCell k="assignee" label="Người phụ trách" sort={sort} onSort={onSort} />
        <HeadCell k="due" label="Hạn chót" sort={sort} onSort={onSort} />
      </div>
      <ul>
        {rows.map((t) => {
          const done = t.status === 'DONE'
          return (
            <li key={t.id} className="border-b last:border-0">
              <button
                type="button"
                onClick={() => onOpen(t)}
                className={cn(
                  'hover:bg-subtle focus-visible:bg-subtle grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 text-left transition-colors outline-none',
                  COLS,
                )}
              >
                <span className="text-muted-foreground num hidden items-center gap-2 text-[13px] font-medium md:flex">
                  {showProject && <span className="size-2 rounded-[2px]" style={{ background: t.project.color }} aria-hidden />}
                  {t.project.key}-{t.number}
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-muted-foreground num shrink-0 text-xs font-medium md:hidden">
                      {t.project.key}-{t.number}
                    </span>
                    <span className={cn('truncate text-sm font-semibold', done && 'text-text-secondary')}>{t.title}</span>
                  </span>
                  {(!!t.labels.length || !!t.checklistTotal || !!t.attachmentCount || !!t.commentCount) && (
                    <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {t.labels.slice(0, 3).map((l) => (
                        <LabelChip key={l} name={l} color={labelColor(colors, l)} className="h-5 text-[11px]" />
                      ))}
                      {!!t.checklistTotal && (
                        <span className="num inline-flex items-center gap-1">
                          <SquareCheck className="size-3.5" strokeWidth={1.8} aria-hidden />
                          {t.checklistDone}/{t.checklistTotal}
                        </span>
                      )}
                      {!!t.attachmentCount && (
                        <span className="num inline-flex items-center gap-1">
                          <Paperclip className="size-3.5" strokeWidth={1.8} aria-hidden />
                          {t.attachmentCount}
                        </span>
                      )}
                      {!!t.commentCount && (
                        <span className="num inline-flex items-center gap-1">
                          <MessageCircle className="size-3.5" strokeWidth={1.8} aria-hidden />
                          {t.commentCount}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span className="flex flex-col items-end gap-1.5 md:block">
                  <StatusBadge status={t.status} />
                  <span className="md:hidden">
                    <DeadlineBadge due={t.dueDate} done={done} completedAt={t.completedAt} hideNone className="h-[22px]" />
                  </span>
                </span>
                <span className="hidden md:block">
                  <PriorityIcon priority={t.priority} withLabel />
                </span>
                <span className="hidden min-w-0 items-center gap-2 text-sm md:flex">
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
                  <DeadlineBadge due={t.dueDate} done={done} completedAt={t.completedAt} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
