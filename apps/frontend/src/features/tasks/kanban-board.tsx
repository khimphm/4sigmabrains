import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Loader2, Plus, X } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api'
import { STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/api'
import { type TaskFilters, useCreateTask, useMoveTask } from './api'
import { TaskCard } from './task-card'

function DraggableCard({ task, onOpen, showProject }: { task: Task; onOpen: (t: Task) => void; showProject?: boolean }) {
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `card:${task.id}`, data: { task } })
  return (
    <div ref={dropRef} className="relative">
      {/* Vạch báo vị trí thả */}
      <div
        className={cn(
          'bg-primary pointer-events-none absolute inset-x-1 -top-[5px] h-0.5 rounded-full opacity-0 transition-opacity',
          isOver && !isDragging && 'opacity-100',
        )}
        aria-hidden
      />
      <div ref={setNodeRef} {...listeners} className={cn('touch-manipulation', isDragging && 'opacity-40')}>
        <TaskCard task={task} onOpen={() => onOpen(task)} showProject={showProject} />
      </div>
    </div>
  )
}

function QuickAdd({ status, projectId, onMore }: { status: TaskStatus; projectId: string; onMore: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const create = useCreateTask()
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const t = title.trim()
    if (!t || create.isPending) return
    create.mutate(
      { projectId, title: t, status },
      {
        onSuccess: (task) => {
          toast.success(`Đã thêm ${task.project.key}-${task.number}`)
          setTitle('')
          requestAnimationFrame(() => ref.current?.focus())
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      setOpen(false)
      setTitle('')
    }
  }

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring/50 flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]"
      >
        <Plus className="size-4" strokeWidth={1.8} /> Thêm việc
      </button>
    )

  return (
    <div className="bg-card border-border-strong shadow-card rounded-[10px] border p-2">
      <label className="sr-only" htmlFor={`quick-add-${status}`}>
        Tên công việc mới ({STATUS_META[status].label})
      </label>
      <textarea
        id={`quick-add-${status}`}
        ref={ref}
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Nhập tên công việc, Enter để thêm"
        className="placeholder:text-muted-foreground w-full resize-none bg-transparent px-1 text-sm leading-snug outline-none"
      />
      <div className="mt-1 flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={submit} disabled={!title.trim() || create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Thêm
        </Button>
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onMore}>
          Chi tiết…
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => (setOpen(false), setTitle(''))}
          aria-label="Đóng"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function Column({ status, tasks, onOpen, onAdd, projectId, showProject }: {
  status: TaskStatus
  tasks: Task[]
  onOpen: (t: Task) => void
  onAdd: (s: TaskStatus) => void
  projectId?: string
  showProject?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}`, data: { status } })
  const meta = STATUS_META[status]
  return (
    <section
      aria-label={`${meta.label}, ${tasks.length} việc`}
      className={cn(
        'bg-subtle border-border/60 flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-[10px] border transition-colors sm:w-[290px] lg:w-auto lg:max-w-none lg:min-w-[260px] lg:flex-1 lg:basis-0',
        isOver && 'border-primary/40 bg-primary-soft/40',
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn('size-2 rounded-full', meta.dot)} aria-hidden />
        <h3 className="text-[15px] font-bold">{meta.label}</h3>
        <span className="text-muted-foreground num text-sm font-medium">{tasks.length}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground ml-auto size-7"
          onClick={() => onAdd(status)}
          aria-label={`Tạo việc trong cột ${meta.label}`}
        >
          <Plus className="size-4" strokeWidth={1.8} />
        </Button>
      </header>
      <div ref={setNodeRef} className="flex min-h-32 flex-1 flex-col gap-2.5 px-2 pb-2">
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} onOpen={onOpen} showProject={showProject} />
        ))}
        {!tasks.length && (
          <div className="text-muted-foreground border-border-strong/70 grid h-20 place-items-center rounded-md border border-dashed text-[13px]">
            Kéo việc vào đây
          </div>
        )}
        {projectId ? (
          <QuickAdd status={status} projectId={projectId} onMore={() => onAdd(status)} />
        ) : (
          <button
            type="button"
            onClick={() => onAdd(status)}
            className="text-muted-foreground hover:bg-card hover:text-foreground flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors"
          >
            <Plus className="size-4" strokeWidth={1.8} /> Thêm việc
          </button>
        )}
      </div>
    </section>
  )
}

export function KanbanBoard({ tasks, filters, onOpen, onAdd, projectId, showProject }: {
  tasks: Task[]
  /** Bộ lọc đang dùng cho useTasks — để cập nhật lạc quan đúng cache */
  filters: TaskFilters
  onOpen: (t: Task) => void
  onAdd: (s: TaskStatus) => void
  /** Có projectId thì cuối mỗi cột hiện ô thêm nhanh */
  projectId?: string
  showProject?: boolean
}) {
  const move = useMoveTask(filters)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  )

  const columns = useMemo(() => {
    const map = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as Task[]])) as Record<TaskStatus, Task[]>
    for (const t of tasks) map[t.status].push(t)
    for (const s of TASK_STATUSES) map[s].sort((a, b) => a.position - b.position)
    return map
  }, [tasks])

  const onDragStart = (e: DragStartEvent) => setActiveTask(e.active.data.current?.task ?? null)

  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null)
    const task = e.active.data.current?.task as Task | undefined
    if (!task || !e.over) return
    const overTask = e.over.data.current?.task as Task | undefined
    const status: TaskStatus = overTask ? overTask.status : e.over.data.current?.status
    if (!status || overTask?.id === task.id) return

    const col = columns[status].filter((t) => t.id !== task.id)
    let position: number
    if (overTask) {
      // Thả lên một thẻ: chèn ngay trước thẻ đó
      const idx = col.findIndex((t) => t.id === overTask.id)
      const prev = col[idx - 1]
      position = prev ? (prev.position + overTask.position) / 2 : overTask.position - 1000
    } else {
      position = col.length ? col[col.length - 1].position + 1000 : Date.now()
    }
    if (status === task.status && position === task.position) return
    move.mutate(
      { id: task.id, status, position },
      {
        onSuccess: () => status !== task.status && toast.success(`Đã chuyển sang "${STATUS_META[status].label}"`),
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveTask(null)}>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:scroll-px-8 md:px-8 lg:snap-none">
        {TASK_STATUSES.map((s) => (
          <Column
            key={s}
            status={s}
            tasks={columns[s]}
            onOpen={onOpen}
            onAdd={onAdd}
            projectId={projectId}
            showProject={showProject}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask && <TaskCard task={activeTask} onOpen={() => {}} dragging showProject={showProject} />}
      </DragOverlay>
    </DndContext>
  )
}
