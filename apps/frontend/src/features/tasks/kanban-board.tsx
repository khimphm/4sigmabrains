import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/api'
import { STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/api'
import { type TaskFilters, useMoveTask } from './api'
import { TaskCard } from './task-card'

function DraggableCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `card:${task.id}`, data: { task } })
  return (
    <div ref={dropRef} className={cn('rounded-lg transition-all', isOver && 'pt-12')}>
      <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && 'opacity-30')}>
        <TaskCard task={task} onOpen={() => onOpen(task)} />
      </div>
    </div>
  )
}

function Column({ status, tasks, onOpen, onAdd }: {
  status: TaskStatus
  tasks: Task[]
  onOpen: (t: Task) => void
  onAdd: (s: TaskStatus) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}`, data: { status } })
  const meta = STATUS_META[status]
  return (
    <div className="flex min-w-[260px] flex-1 basis-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full', meta.dot)} />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="bg-muted text-muted-foreground rounded-full px-2 text-xs">{tasks.length}</span>
        <Button variant="ghost" size="icon" className="ml-auto size-7" onClick={() => onAdd(status)} aria-label="Thêm công việc">
          <Plus className="size-4" />
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'bg-muted/50 flex min-h-40 flex-1 flex-col gap-2 rounded-xl p-2 transition-colors',
          isOver && 'bg-primary/5 ring-primary/30 ring-2',
        )}
      >
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} onOpen={onOpen} />
        ))}
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="text-muted-foreground hover:bg-card hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors"
        >
          <Plus className="size-4" /> Thêm công việc
        </button>
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks, filters, onOpen, onAdd }: {
  tasks: Task[]
  filters: TaskFilters
  onOpen: (t: Task) => void
  onAdd: (s: TaskStatus) => void
}) {
  const move = useMoveTask(filters)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

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
    move.mutate({ id: task.id, status, position }, { onError: (err) => toast.error(errorMessage(err)) })
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveTask(null)}>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        {TASK_STATUSES.map((s) => (
          <Column key={s} status={s} tasks={columns[s]} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} onOpen={() => {}} dragging />}</DragOverlay>
    </DndContext>
  )
}
