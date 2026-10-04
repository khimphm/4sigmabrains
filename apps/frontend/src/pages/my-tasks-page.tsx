import { addDays, endOfWeek, isBefore, isToday } from 'date-fns'
import { CheckSquare, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { UserSelect } from '@/components/user-select'
import { type TaskView, ViewSwitcher } from '@/components/view-switcher'
import { useAuth } from '@/features/auth/use-auth'
import { useTasks } from '@/features/tasks/api'
import { TaskCalendar } from '@/features/tasks/task-calendar'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { TaskTable } from '@/features/tasks/task-table'
import { useOpenTask } from '@/hooks/use-open-task'
import type { Task } from '@/types/api'

// Gom việc theo mốc thời gian
function groupTasks(tasks: Task[]) {
  const now = new Date()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const groups: Record<string, Task[]> = { 'Quá hạn': [], 'Hôm nay': [], 'Tuần này': [], 'Sau này': [], 'Chưa có hạn': [], 'Đã xong': [] }
  for (const t of tasks) {
    if (t.status === 'DONE') groups['Đã xong'].push(t)
    else if (!t.dueDate) groups['Chưa có hạn'].push(t)
    else {
      const d = new Date(t.dueDate)
      if (isBefore(d, now) && !isToday(d)) groups['Quá hạn'].push(t)
      else if (isToday(d)) groups['Hôm nay'].push(t)
      else if (isBefore(d, addDays(weekEnd, 1))) groups['Tuần này'].push(t)
      else groups['Sau này'].push(t)
    }
  }
  for (const k of Object.keys(groups)) groups[k].sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
  return Object.entries(groups).filter(([, v]) => v.length)
}

export function MyTasksPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const assignee = params.get('assignee') ?? user!.id
  const [view, setView] = useState<TaskView>('list')
  const [showDone, setShowDone] = useState(false)
  const [newTask, setNewTask] = useState(false)
  const openTask = useOpenTask()
  const { data: tasks = [], isLoading } = useTasks({ assigneeId: assignee, includeDone: showDone || view === 'calendar' ? undefined : false })
  const groups = useMemo(() => groupTasks(tasks), [tasks])
  const isMe = assignee === user?.id

  return (
    <PageContainer wide>
      <PageHeader
        title={isMe ? 'Việc của tôi' : 'Việc của thành viên'}
        description={`${tasks.filter((t) => t.status !== 'DONE').length} việc đang mở`}
        actions={
          <>
            <UserSelect
              className="w-52"
              allowEmpty={false}
              value={assignee}
              onChange={(id) => setParams((p) => (id === user?.id ? p.delete('assignee') : p.set('assignee', id!), p))}
            />
            <ViewSwitcher value={view} onChange={setView} views={['list', 'calendar']} />
            <Button onClick={() => setNewTask(true)}>
              <Plus /> Công việc mới
            </Button>
          </>
        }
      >
        {view === 'list' && (
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <Switch checked={showDone} onCheckedChange={setShowDone} /> Hiện việc đã xong
          </label>
        )}
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : view === 'calendar' ? (
        <TaskCalendar tasks={tasks} onOpen={openTask} />
      ) : groups.length ? (
        <div className="space-y-8">
          {groups.map(([label, items]) => (
            <section key={label}>
              <h2 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${label === 'Quá hạn' ? 'text-red-600' : ''}`}>
                {label}
                <span className="bg-muted text-muted-foreground rounded-full px-2 text-xs font-normal">{items.length}</span>
              </h2>
              <TaskTable tasks={items} onOpen={openTask} showProject />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="Không có việc nào"
          description="Mọi việc đã xong. Tạo việc mới hoặc nghỉ ngơi một chút!"
          action={<Button onClick={() => setNewTask(true)}><Plus /> Công việc mới</Button>}
        />
      )}
      <TaskFormDialog open={newTask} onOpenChange={setNewTask} assigneeId={assignee} dueDate={undefined} />
    </PageContainer>
  )
}
