import { addDays, endOfWeek, isBefore, isToday, startOfDay, subDays } from 'date-fns'
import { CheckSquare, ChevronDown, Plus, Search, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { UserSelect } from '@/components/user-select'
import { type TaskView, ViewSwitcher } from '@/components/view-switcher'
import { useAuth } from '@/features/auth/use-auth'
import { MyTaskCard, MyTaskRow } from '@/features/dashboard/my-task-row'
import { ProjectDot } from '@/features/dashboard/section-card'
import { useProjects } from '@/features/projects/api'
import { useTasks } from '@/features/tasks/api'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task, TaskPriority } from '@/types/api'

type GroupKey = 'overdue' | 'today' | 'week' | 'later' | 'none' | 'done'

const GROUPS: { key: GroupKey; label: string; tone: string; hint?: string }[] = [
  { key: 'overdue', label: 'Quá hạn', tone: 'text-overdue-foreground' },
  { key: 'today', label: 'Hôm nay', tone: 'text-due-soon-foreground' },
  { key: 'week', label: 'Tuần này', tone: 'text-foreground' },
  { key: 'later', label: 'Sau đó', tone: 'text-foreground' },
  { key: 'none', label: 'Chưa có hạn', tone: 'text-text-secondary' },
  { key: 'done', label: 'Đã xong gần đây', tone: 'text-on-time-foreground', hint: '14 ngày qua' },
]

const due = (t: Task) => (t.dueDate ? new Date(t.dueDate).getTime() : Infinity)

// Gom việc theo mốc thời gian
function groupTasks(tasks: Task[]) {
  const now = new Date()
  const weekEnd = addDays(startOfDay(endOfWeek(now, { weekStartsOn: 1 })), 1)
  const doneSince = subDays(now, 14)
  const groups: Record<GroupKey, Task[]> = { overdue: [], today: [], week: [], later: [], none: [], done: [] }
  for (const t of tasks) {
    if (t.status === 'DONE') {
      if (!t.completedAt || new Date(t.completedAt) >= doneSince) groups.done.push(t)
    } else if (!t.dueDate) groups.none.push(t)
    else {
      const d = new Date(t.dueDate)
      if (isBefore(d, now)) groups.overdue.push(t)
      else if (isToday(d)) groups.today.push(t)
      else if (isBefore(d, weekEnd)) groups.week.push(t)
      else groups.later.push(t)
    }
  }
  for (const k of ['overdue', 'today', 'week', 'later'] as const) groups[k].sort((a, b) => due(a) - due(b))
  groups.none.sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority))
  groups.done.sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime())
  groups.done = groups.done.slice(0, 15)
  return groups
}

const ALL = 'all'

export function MyTasksPage() {
  const { user, isManager } = useAuth()
  const [params, setParams] = useSearchParams()
  const assignee = params.get('assignee') ?? user!.id
  const view: TaskView = params.get('view') === 'board' ? 'board' : 'list'
  const projectId = params.get('project') ?? ALL
  const priority = (params.get('priority') ?? ALL) as TaskPriority | typeof ALL
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Partial<Record<GroupKey, boolean>>>({})
  const [newTask, setNewTask] = useState(false)
  const { data: tasks = [], isLoading } = useTasks({ assigneeId: assignee })
  const { data: projects = [] } = useProjects()
  const isMe = assignee === user?.id

  const setParam = (k: string, v: string | null) =>
    setParams(
      (p) => {
        if (v === null) p.delete(k)
        else p.set(k, v)
        return p
      },
      { replace: true },
    )

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        (projectId === ALL || t.projectId === projectId) &&
        (priority === ALL || t.priority === priority) &&
        (!term || t.title.toLowerCase().includes(term) || `${t.project.key}-${t.number}`.toLowerCase().includes(term)),
    )
  }, [tasks, projectId, priority, q])
  const groups = useMemo(() => groupTasks(filtered), [filtered])
  const openCount = tasks.filter((t) => t.status !== 'DONE').length
  const allGroups = useMemo(() => groupTasks(tasks), [tasks])
  const hasFilter = projectId !== ALL || priority !== ALL || !!q.trim()
  const visible = GROUPS.filter((g) => groups[g.key].length)
  const boardTasks = filtered.filter((t) => t.status !== 'DONE' || groups.done.includes(t))

  const clearFilters = () => {
    setQ('')
    setParams(
      (p) => {
        p.delete('project')
        p.delete('priority')
        return p
      },
      { replace: true },
    )
  }

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: 'Việc của tôi' }]}
        actions={
          <Button onClick={() => setNewTask(true)}>
            <Plus /> Tạo việc
          </Button>
        }
      />
      <PageHeader
        title={isMe ? 'Việc của tôi' : 'Việc của thành viên'}
        description={
          isLoading ? 'Đang tải…' : (
            <>
              {openCount} việc đang mở
              {allGroups.overdue.length > 0 && (
                <span className="text-overdue-foreground font-semibold"> · {allGroups.overdue.length} quá hạn</span>
              )}
              {allGroups.today.length > 0 && <> · {allGroups.today.length} đến hạn hôm nay</>}
            </>
          )
        }
        actions={<ViewSwitcher value={view} onChange={(v) => setParam('view', v === 'list' ? null : v)} views={['list', 'board']} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc mã việc"
              aria-label="Tìm việc"
              className="h-9 pl-8"
            />
          </div>
          <Select value={projectId} onValueChange={(v) => setParam('project', v === ALL ? null : v)}>
            <SelectTrigger className="h-9 w-[calc(50%-4px)] sm:w-48" aria-label="Lọc theo dự án">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả dự án</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <ProjectDot color={p.color} /> {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setParam('priority', v === ALL ? null : v)}>
            <SelectTrigger className="h-9 w-[calc(50%-4px)] sm:w-40" aria-label="Lọc theo độ ưu tiên">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Mọi độ ưu tiên</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isManager && (
            <UserSelect
              className="h-9 w-full sm:w-52"
              allowEmpty={false}
              value={assignee}
              onChange={(id) => setParam('assignee', !id || id === user?.id ? null : id)}
            />
          )}
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X /> Xoá lọc
            </Button>
          )}
        </div>
      </PageHeader>

      {isLoading ? (
        <ListSkeleton />
      ) : !tasks.length ? (
        <EmptyState
          icon={CheckSquare}
          title={isMe ? 'Bạn chưa có việc nào' : 'Thành viên này chưa có việc nào'}
          description="Tạo việc mới hoặc nhận việc từ một dự án."
          action={
            <Button onClick={() => setNewTask(true)}>
              <Plus /> Tạo việc
            </Button>
          }
        />
      ) : !visible.length ? (
        <EmptyState
          icon={SearchX}
          title="Không có việc phù hợp"
          description="Thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : view === 'board' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="grid min-w-[880px] grid-cols-4 gap-4">
            {TASK_STATUSES.map((s) => {
              const col = boardTasks.filter((t) => t.status === s).sort((a, b) => due(a) - due(b))
              return (
                <section key={s} aria-label={STATUS_META[s].label} className="bg-subtle/70 min-w-0 rounded-[10px] border p-2.5">
                  <h2 className="flex items-center gap-2 px-1.5 pt-1 pb-2.5 text-[14px] font-bold">
                    <span aria-hidden className={cn('size-2 rounded-full', STATUS_META[s].dot)} />
                    {STATUS_META[s].label}
                    <span className="text-muted-foreground num font-medium">{col.length}</span>
                  </h2>
                  <ul className="space-y-2">
                    {col.map((t) => (
                      <MyTaskCard key={t.id} task={t} />
                    ))}
                    {!col.length && <li className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-[13px]">Trống</li>}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((g) => {
            const items = groups[g.key]
            const closed = collapsed[g.key] ?? false
            return (
              <section key={g.key} aria-labelledby={`grp-${g.key}`} className="bg-card shadow-card overflow-hidden rounded-[10px] border">
                <h2 id={`grp-${g.key}`}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !closed }))}
                    aria-expanded={!closed}
                    className="hover:bg-subtle/60 focus-visible:bg-subtle flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors outline-none sm:px-5"
                  >
                    <ChevronDown
                      className={cn('text-muted-foreground size-4 transition-transform duration-200', closed && '-rotate-90')}
                      aria-hidden
                    />
                    <span className={cn('text-[15px] font-bold', g.tone)}>{g.label}</span>
                    <span className="bg-subtle text-text-secondary num rounded-full px-2 text-[12px] font-semibold">{items.length}</span>
                    {g.hint && <span className="text-muted-foreground text-[13px]">· {g.hint}</span>}
                  </button>
                </h2>
                {!closed && (
                  <ul className="divide-y border-t">
                    {items.map((t) => (
                      <MyTaskRow key={t.id} task={t} />
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
      <TaskFormDialog open={newTask} onOpenChange={setNewTask} assigneeId={assignee} projectId={projectId === ALL ? undefined : projectId} />
    </PageContainer>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[4, 3].map((n, i) => (
        <div key={i} className="bg-card shadow-card overflow-hidden rounded-[10px] border">
          <div className="px-5 py-3.5">
            <Skeleton className="h-4 w-32" />
          </div>
          {Array.from({ length: n }).map((_, j) => (
            <div key={j} className="flex items-center gap-3 border-t px-5 py-3">
              <Skeleton className="size-[18px] rounded" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-6 w-24 sm:block" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
