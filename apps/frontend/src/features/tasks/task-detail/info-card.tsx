import { CalendarDays } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { DeadlineBadge } from '@/components/pill'
import { PriorityIcon, StatusDot } from '@/components/task-meta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserAvatar } from '@/components/user-avatar'
import { UserSelect } from '@/components/user-select'
import { errorMessage } from '@/lib/api'
import { PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { fmtDate, fmtDateTime, fromLocalInput, toLocalInput } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TaskDetail, TaskPriority, TaskStatus } from '@/types/api'
import { type TaskInput, useUpdateTask } from '../api'
import { LabelPicker } from './label-picker'
import { SectionCard } from './section-card'

const GHOST_TRIGGER =
  'hover:bg-subtle data-[state=open]:bg-subtle -ml-2 h-8 w-auto max-w-full border-transparent bg-transparent px-2 shadow-none dark:bg-transparent'

function Row({ label, children, htmlFor, className }: { label: string; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[116px_minmax(0,1fr)] items-center gap-3 py-2.5', className)}>
      <label htmlFor={htmlFor} className="text-text-secondary text-sm">
        {label}
      </label>
      <div className="min-w-0 text-[15px]">{children}</div>
    </div>
  )
}

export function InfoCard({ task }: { task: TaskDetail }) {
  const update = useUpdateTask()
  const [now] = useState(() => Date.now())
  const done = task.status === 'DONE'
  const save = (data: Omit<TaskInput, 'id'>, ok?: string) =>
    update.mutate(
      { id: task.id, ...data },
      { onSuccess: () => ok && toast.success(ok), onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <SectionCard title="Thông tin" size="M">
      <div className="divide-border -mt-1 divide-y">
        <Row label="Trạng thái">
          <Select value={task.status} onValueChange={(v) => save({ status: v as TaskStatus })}>
            <SelectTrigger size="sm" className={GHOST_TRIGGER} aria-label="Trạng thái">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <StatusDot status={s} />
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Người phụ trách">
          <UserSelect
            className={GHOST_TRIGGER}
            value={task.assigneeId}
            onChange={(assigneeId) => save({ assigneeId }, 'Đã đổi người phụ trách')}
          />
        </Row>
        <Row label="Người giao">
          {task.reporter ? (
            <span className="flex min-w-0 items-center gap-2">
              <UserAvatar user={task.reporter} className="size-6" />
              <span className="truncate">{task.reporter.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Không rõ</span>
          )}
        </Row>
        <Row label="Bắt đầu">
          <DateField
            label="Ngày bắt đầu"
            type="date"
            value={task.startDate}
            onSave={(v) => save({ startDate: v }, v ? 'Đã đổi ngày bắt đầu' : 'Đã bỏ ngày bắt đầu')}
          />
        </Row>
        <Row label="Hạn hoàn thành" className="items-start">
          <div className="space-y-1">
            <DateField
              label="Hạn hoàn thành"
              type="datetime-local"
              value={task.dueDate}
              className={cn(
                'font-semibold',
                !done && task.dueDate && new Date(task.dueDate).getTime() < now && 'text-overdue-foreground',
              )}
              onSave={(v) => save({ dueDate: v }, v ? 'Đã đổi hạn, hệ thống sẽ nhắc lại theo hạn mới' : 'Đã bỏ hạn chót')}
            />
            <DeadlineBadge due={task.dueDate} done={done} completedAt={task.completedAt} hideNone />
          </div>
        </Row>
        <Row label="Mức ưu tiên">
          <Select value={task.priority} onValueChange={(v) => save({ priority: v as TaskPriority })}>
            <SelectTrigger size="sm" className={GHOST_TRIGGER} aria-label="Mức ưu tiên">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <PriorityIcon priority={p} />
                  {PRIORITY_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Nhãn" className="items-start">
          <LabelPicker value={task.labels} onChange={(labels) => save({ labels })} className="pt-0.5" />
        </Row>
        <Row label="Dự án">
          <Link
            to={`/projects/${task.projectId}`}
            className="hover:text-primary inline-flex max-w-full min-w-0 items-center gap-2 font-medium transition-colors hover:underline"
          >
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: task.project.color }} aria-hidden />
            <span className="truncate">{task.project.name}</span>
          </Link>
        </Row>
        <Row label="Tạo lúc">
          <span className="text-text-secondary text-sm">{fmtDateTime(task.createdAt)}</span>
        </Row>
        <Row label="Cập nhật">
          <span className="text-text-secondary text-sm">{fmtDateTime(task.updatedAt)}</span>
        </Row>
        {done && task.completedAt && (
          <Row label="Hoàn thành">
            <span className="text-text-secondary text-sm">{fmtDateTime(task.completedAt)}</span>
          </Row>
        )}
      </div>
    </SectionCard>
  )
}

// Hiển thị ngày dạng dd/MM/yyyy (HH:mm), bấm để mở ô chọn ngày
function DateField({
  label,
  type,
  value,
  onSave,
  className,
}: {
  label: string
  type: 'date' | 'datetime-local'
  value: string | null
  onSave: (iso: string | null) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const toInput = (iso: string | null) => (type === 'date' ? (iso ? fmtDate(iso, 'yyyy-MM-dd') : '') : toLocalInput(iso))
  const toIso = (v: string) => (type === 'date' ? (v ? new Date(`${v}T00:00`).toISOString() : null) : fromLocalInput(v))
  const commit = (iso: string | null) => {
    const same = (iso && value && new Date(iso).getTime() === new Date(value).getTime()) || (!iso && !value)
    if (!same) onSave(iso)
    setOpen(false)
  }
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(toInput(value))
        setOpen(o)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${value ? (type === 'date' ? fmtDate(value) : fmtDateTime(value)) : 'chưa đặt'}. Bấm để đổi`}
          className={cn(
            'hover:bg-subtle data-[state=open]:bg-subtle focus-visible:ring-ring/50 -ml-2 inline-flex h-8 max-w-full cursor-pointer items-center gap-1.5 rounded-md px-2 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
            className,
          )}
        >
          <CalendarDays className="text-muted-foreground size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          {value ? (
            <span className="num truncate">{type === 'date' ? fmtDate(value) : fmtDate(value, 'dd/MM/yyyy, HH:mm')}</span>
          ) : (
            <span className="text-muted-foreground font-normal">Chưa đặt</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <label className="text-text-secondary block text-[13px] font-semibold" htmlFor={`df-${label}`}>
          {label}
        </label>
        <Input id={`df-${label}`} type={type} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => commit(null)} disabled={!value}>
            Bỏ trống
          </Button>
          <Button variant="outline" size="sm" onClick={() => commit(toIso(draft))} className="font-semibold">
            Lưu
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
