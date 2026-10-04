import { ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AttachmentList } from '@/components/attachment-list'
import { CommentThread } from '@/components/comment-thread'
import { PriorityIcon, StatusDot } from '@/components/task-meta'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/user-avatar'
import { UserSelect } from '@/components/user-select'
import { ActivityFeed } from '@/features/activity-feed'
import { errorMessage } from '@/lib/api'
import { PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { fmtDateTime, fromLocalInput, isOverdue, toLocalInput } from '@/lib/format'
import type { Task } from '@/types/api'
import {
  useAddComment,
  useChecklist,
  useDeleteComment,
  useDeleteTask,
  useTask,
  useTaskActivity,
  useTaskComments,
  useUpdateTask,
} from './api'

// Chi tiết công việc mở dạng ngăn bên phải, điều khiển bằng ?task=<id> trên URL
export function TaskSheet() {
  const [params, setParams] = useSearchParams()
  const taskId = params.get('task')
  const close = () => {
    const next = new URLSearchParams(params)
    next.delete('task')
    setParams(next, { replace: true })
  }

  return (
    <Sheet open={!!taskId} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl" showCloseButton={false}>
        {taskId && <TaskDetail taskId={taskId} onClose={close} />}
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)] items-center gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function TaskDetail({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { data: task, isLoading, error } = useTask(taskId)
  const update = useUpdateTask()
  const del = useDeleteTask()

  const save = (data: Parameters<typeof update.mutate>[0]) =>
    update.mutate(data, { onError: (e) => toast.error(errorMessage(e)) })

  if (error) {
    return (
      <div className="p-8 text-center">
        <SheetTitle>Không mở được công việc</SheetTitle>
        <SheetDescription className="mt-2">{errorMessage(error)}</SheetDescription>
      </div>
    )
  }
  if (isLoading || !task) {
    return (
      <div className="space-y-4 p-6">
        <SheetTitle className="sr-only">Đang tải</SheetTitle>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const done = task.status === 'DONE'
  return (
    <>
      <div className="bg-background/95 sticky top-0 z-10 flex items-center gap-2 border-b px-6 py-3 backdrop-blur">
        <span className="size-2.5 rounded-[3px]" style={{ background: task.project.color }} />
        <Link to={`/projects/${task.projectId}`} className="text-muted-foreground text-sm hover:underline">
          {task.project.name}
        </Link>
        <span className="text-muted-foreground font-mono text-xs">
          / {task.project.key}-{task.number}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Sao chép liên kết"
            onClick={() => {
              navigator.clipboard.writeText(`${location.origin}/projects/${task.projectId}?task=${task.id}`)
              toast.success('Đã sao chép liên kết')
            }}
          >
            <ExternalLink className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hover:text-red-600"
            aria-label="Xoá công việc"
            onClick={() => {
              if (!confirm('Xoá công việc này?')) return
              del.mutate(task.id, {
                onSuccess: () => (toast.success('Đã xoá công việc'), onClose()),
                onError: (e) => toast.error(errorMessage(e)),
              })
            }}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Đóng">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-6 py-5">
        <div>
          <SheetTitle className="sr-only">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Chi tiết công việc</SheetDescription>
          <EditableTitle key={task.title} value={task.title} onSave={(title) => save({ id: task.id, title })} />
        </div>

        <div className="space-y-3">
          <Field label="Trạng thái">
            <Select value={task.status} onValueChange={(v) => save({ id: task.id, status: v as Task['status'] })}>
              <SelectTrigger className="w-48">
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
          </Field>
          <Field label="Người làm">
            <UserSelect className="w-60" value={task.assigneeId} onChange={(assigneeId) => save({ id: task.id, assigneeId })} />
          </Field>
          <Field label="Độ ưu tiên">
            <Select value={task.priority} onValueChange={(v) => save({ id: task.id, priority: v as Task['priority'] })}>
              <SelectTrigger className="w-48">
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
          </Field>
          <Field label="Hạn chót">
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                className="w-60"
                defaultValue={toLocalInput(task.dueDate)}
                key={task.dueDate}
                onBlur={(e) => {
                  const v = fromLocalInput(e.target.value)
                  if (v !== task.dueDate) save({ id: task.id, dueDate: v })
                }}
              />
              {isOverdue(task.dueDate, done) && <span className="text-xs font-medium text-red-600">Quá hạn</span>}
              {done && task.completedAt && task.dueDate && (
                <span className={`text-xs font-medium ${new Date(task.completedAt) <= new Date(task.dueDate) ? 'text-emerald-600' : 'text-red-600'}`}>
                  {new Date(task.completedAt) <= new Date(task.dueDate) ? 'Xong đúng hạn' : 'Xong trễ hạn'}
                </span>
              )}
            </div>
          </Field>
          <Field label="Nhãn">
            <LabelsEditor labels={task.labels} onChange={(labels) => save({ id: task.id, labels })} />
          </Field>
          <Field label="Người tạo">
            <span className="flex items-center gap-2 text-sm">
              {task.reporter && <UserAvatar user={task.reporter} className="size-5" />}
              {task.reporter?.name}
              <span className="text-muted-foreground text-xs">· {fmtDateTime(task.createdAt)}</span>
            </span>
          </Field>
        </div>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Mô tả</h3>
          <Textarea
            key={task.updatedAt}
            defaultValue={task.description ?? ''}
            placeholder="Thêm mô tả chi tiết, yêu cầu, tiêu chí hoàn thành…"
            className="min-h-28"
            onBlur={(e) => {
              if (e.target.value !== (task.description ?? '')) save({ id: task.id, description: e.target.value || null })
            }}
          />
        </section>

        <Checklist task={task} />

        <section>
          <h3 className="mb-2 text-sm font-semibold">File đính kèm</h3>
          <AttachmentList target="TASK" targetId={task.id} />
        </section>

        <Tabs defaultValue="comments">
          <TabsList>
            <TabsTrigger value="comments">Bình luận</TabsTrigger>
            <TabsTrigger value="activity">Lịch sử</TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="pt-3">
            <Comments taskId={task.id} />
          </TabsContent>
          <TabsContent value="activity" className="pt-3">
            <TaskActivity taskId={task.id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value)
  return (
    <Textarea
      value={v}
      rows={1}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() && v !== value && onSave(v.trim())}
      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
      className="min-h-0 resize-none border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0 md:text-xl"
    />
  )
}

function LabelsEditor({ labels, onChange }: { labels: string[]; onChange: (l: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const l = input.trim()
    if (l && !labels.includes(l)) onChange([...labels, l])
    setInput('')
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labels.map((l) => (
        <span key={l} className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
          {l}
          <button type="button" onClick={() => onChange(labels.filter((x) => x !== l))} aria-label={`Bỏ nhãn ${l}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        onBlur={add}
        placeholder="+ Thêm nhãn"
        className="h-7 w-32 border-dashed text-xs"
      />
    </div>
  )
}

function Checklist({ task }: { task: Task }) {
  const items = task.checklist ?? []
  const { add, update, remove } = useChecklist(task.id)
  const [text, setText] = useState('')
  const doneCount = items.filter((i) => i.done).length

  const submit = () => {
    if (!text.trim()) return
    add.mutate(text.trim(), { onSuccess: () => setText('') })
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <h3 className="text-sm font-semibold">Checklist</h3>
        {!!items.length && (
          <>
            <Progress value={(doneCount / items.length) * 100} className="h-1.5 max-w-40" />
            <span className="text-muted-foreground text-xs">
              {doneCount}/{items.length}
            </span>
          </>
        )}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="hover:bg-muted/60 group flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <Checkbox checked={item.done} onCheckedChange={(c) => update.mutate({ id: item.id, done: !!c })} />
            <span className={`flex-1 text-sm ${item.done ? 'text-muted-foreground line-through' : ''}`}>{item.content}</span>
            <button
              type="button"
              className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-600"
              onClick={() => remove.mutate(item.id)}
              aria-label="Xoá mục"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 px-2">
          <Plus className="text-muted-foreground size-4" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Thêm mục cần làm, Enter để lưu"
            className="h-8 border-none px-1 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </section>
  )
}

function Comments({ taskId }: { taskId: string }) {
  const { data = [] } = useTaskComments(taskId)
  const add = useAddComment(taskId)
  const remove = useDeleteComment(taskId)
  return (
    <CommentThread
      comments={data}
      submitting={add.isPending}
      onSubmit={(d) => add.mutateAsync(d).catch((e) => toast.error(errorMessage(e)))}
      onDelete={(id) => remove.mutate(id)}
    />
  )
}

function TaskActivity({ taskId }: { taskId: string }) {
  const { data = [] } = useTaskActivity(taskId)
  return <ActivityFeed items={data} compact />
}
