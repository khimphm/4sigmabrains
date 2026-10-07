import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCircle2,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { DeadlineBadge, Pill } from '@/components/pill'
import { StatusDot } from '@/components/task-meta'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { errorMessage } from '@/lib/api'
import { STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import type { TaskDetail, TaskStatus } from '@/types/api'
import { useDeleteTask, useUpdateTask, useWatchTask } from '../api'
import { PRIORITY_PILL, PRIORITY_TONE, STATUS_TONE, taskCode } from './meta'

export function TaskHeader({ task }: { task: TaskDetail }) {
  const navigate = useNavigate()
  const update = useUpdateTask()
  const watch = useWatchTask(task.id)
  const remove = useDeleteTask()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const done = task.status === 'DONE'

  const back = () => {
    // Có lịch sử trong ứng dụng thì quay lại, không thì về bảng của dự án
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(`/projects/${task.projectId}`)
  }

  const setStatus = (status: TaskStatus, withUndo = true) => {
    const prev = task.status
    if (status === prev) return
    update.mutate(
      { id: task.id, status },
      {
        onSuccess: () =>
          toast.success(status === 'DONE' ? 'Đã đánh dấu hoàn thành' : `Đã chuyển sang “${STATUS_META[status].label}”`, {
            action: withUndo ? { label: 'Hoàn tác', onClick: () => setStatus(prev, false) } : undefined,
          }),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  const toggleWatch = () =>
    watch.mutate(!task.watching, {
      onSuccess: (t) =>
        toast.success(t.watching ? 'Bạn sẽ nhận thông báo khi công việc thay đổi' : 'Đã bỏ theo dõi công việc'),
      onError: (e) => toast.error(errorMessage(e)),
    })

  const copyLink = () => {
    navigator.clipboard
      .writeText(`${location.origin}/tasks/${task.id}`)
      .then(() => toast.success('Đã sao chép liên kết'))
      .catch(() => toast.error('Không sao chép được liên kết'))
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={back} className="font-semibold">
          <ArrowLeft className="size-4" strokeWidth={1.8} />
          Quay lại bảng
        </Button>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={STATUS_TONE[task.status]}>{STATUS_META[task.status].label}</Pill>
          <Pill tone={PRIORITY_TONE[task.priority]}>{PRIORITY_PILL[task.priority]}</Pill>
          <DeadlineBadge due={task.dueDate} done={done} completedAt={task.completedAt} />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <EditableTitle
            value={task.title}
            editing={editingTitle}
            onEditingChange={setEditingTitle}
            onSave={(title) =>
              update.mutate(
                { id: task.id, title },
                { onSuccess: () => toast.success('Đã đổi tiêu đề'), onError: (e) => toast.error(errorMessage(e)) },
              )
            }
            done={done}
          />
          <p className="text-text-secondary mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
            <span className="num font-medium">{taskCode(task)}</span>
            <span aria-hidden>•</span>
            <Link
              to={`/projects/${task.projectId}`}
              className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors hover:underline"
            >
              <span className="size-2 rounded-[3px]" style={{ background: task.project.color }} aria-hidden />
              {task.project.name}
            </Link>
            {task.reporter && (
              <>
                <span aria-hidden>•</span>
                <span>
                  Giao bởi {task.reporter.name} ngày {fmtDate(task.createdAt)}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={toggleWatch}
            disabled={watch.isPending}
            aria-pressed={task.watching}
            className="h-10 px-4 font-semibold"
          >
            {watch.isPending ? (
              <Loader2 className="animate-spin" />
            ) : task.watching ? (
              <BellRing className="text-primary size-4" strokeWidth={1.8} />
            ) : (
              <Bell className="size-4" strokeWidth={1.8} />
            )}
            <span className="sr-only sm:not-sr-only">{task.watching ? 'Đang theo dõi' : 'Theo dõi'}</span>
          </Button>
          {done ? (
            <Button
              variant="outline"
              className="h-10 px-4 font-semibold"
              onClick={() => setStatus('IN_PROGRESS')}
              disabled={update.isPending}
            >
              {update.isPending ? <Loader2 className="animate-spin" /> : <RotateCcw className="size-4" strokeWidth={1.8} />}
              Mở lại
            </Button>
          ) : (
            <Button className="h-10 min-w-0 flex-1 px-4 md:flex-none" onClick={() => setStatus('DONE')} disabled={update.isPending}>
              {update.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-4" strokeWidth={1.8} />}
              Đánh dấu hoàn thành
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-10" aria-label="Thao tác khác">
                <MoreHorizontal className="size-4" strokeWidth={1.8} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setEditingTitle(true)}>
                <Pencil /> Sửa tiêu đề
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => document.getElementById('task-description')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Pencil /> Sửa mô tả
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <StatusDot status={task.status} />
                  <span className="ml-1">Đổi trạng thái</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={task.status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    {TASK_STATUSES.map((s) => (
                      <DropdownMenuRadioItem key={s} value={s}>
                        {STATUS_META[s].label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={copyLink}>
                <Link2 /> Sao chép liên kết
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Xoá công việc
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá công việc {taskCode(task)}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{task.title}” cùng checklist và bình luận sẽ bị xoá vĩnh viễn. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(task.id, {
                  onSuccess: () => {
                    toast.success('Đã xoá công việc')
                    navigate(`/projects/${task.projectId}`, { replace: true })
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Xoá công việc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditableTitle({
  value,
  editing,
  onEditingChange,
  onSave,
  done,
}: {
  value: string
  editing: boolean
  onEditingChange: (v: boolean) => void
  onSave: (v: string) => void
  done: boolean
}) {
  if (editing)
    return (
      <TitleInput
        value={value}
        onDone={(t) => {
          if (t && t !== value) onSave(t)
          onEditingChange(false)
        }}
      />
    )
  return (
    <h1 className="text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
      <button
        type="button"
        onClick={() => onEditingChange(true)}
        title="Bấm để sửa tiêu đề"
        className="hover:bg-subtle focus-visible:ring-ring/50 -mx-1.5 cursor-text rounded-md px-1.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {done && <CheckCircle2 className="text-on-time-foreground mr-2 inline size-6 align-[-3px]" aria-label="Đã hoàn thành" />}
        {value}
      </button>
    </h1>
  )
}

function TitleInput({ value, onDone }: { value: string; onDone: (v: string | null) => void }) {
  const [v, setV] = useState(value)
  return (
    <textarea
      autoFocus
      value={v}
      rows={1}
      maxLength={300}
      aria-label="Tiêu đề công việc"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onDone(v.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === 'Escape') onDone(null)
      }}
      className="border-ring ring-ring/40 bg-card -mx-1.5 w-[calc(100%+12px)] resize-none rounded-md border px-1.5 text-[24px] leading-tight font-extrabold tracking-tight ring-[3px] outline-none [field-sizing:content] md:text-[28px]"
    />
  )
}
