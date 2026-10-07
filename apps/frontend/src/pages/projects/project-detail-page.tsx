import { FolderX, ListTodo, MoreHorizontal, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer } from '@/components/page-header'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { DiscussionList } from '@/features/discussions/discussion-list'
import { FileLibrary } from '@/features/files/file-library'
import { useDeleteProject, useProject, useWorkspaceSettings } from '@/features/projects/api'
import { MembersDialog } from '@/features/projects/members-dialog'
import { ProjectFormDialog } from '@/features/projects/project-form-dialog'
import { ProjectDue, ProjectMark, ProjectProgress, ProjectStatusPill } from '@/features/projects/project-parts'
import { projectLead } from '@/features/projects/project-utils'
import { type TaskFilters, useTasks } from '@/features/tasks/api'
import { KanbanBoard } from '@/features/tasks/kanban-board'
import { TaskCalendar } from '@/features/tasks/task-calendar'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { TaskTable } from '@/features/tasks/task-table'
import { useOpenTask } from '@/hooks/use-open-task'
import { errorMessage } from '@/lib/api'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/api'
import { ProjectOverview } from './project-overview'
import { TaskFilterBar } from './task-filter-bar'
import type { ProjectTaskFilters } from './task-filters'

const TABS = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'list', label: 'Danh sách' },
  { value: 'board', label: 'Bảng' },
  { value: 'calendar', label: 'Lịch' },
  { value: 'files', label: 'Tệp và bản vẽ' },
  { value: 'discussions', label: 'Thảo luận' },
] as const
type Tab = (typeof TABS)[number]['value']
const TASK_TABS: Tab[] = ['list', 'board', 'calendar']

const EMPTY_FILTERS: ProjectTaskFilters = { q: '', assignee: null, due: null, label: null }

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user, isManager } = useAuth()
  const { data: project, isLoading, isError } = useProject(id)
  const { data: settings } = useWorkspaceSettings()
  const openTask = useOpenTask()
  const del = useDeleteProject()

  const tabParam = params.get('tab') as Tab | null
  const tab: Tab = TABS.some((t) => t.value === tabParam) ? tabParam! : 'board'
  const setTab = (t: Tab) =>
    setParams(
      (p) => {
        if (t === 'board') p.delete('tab')
        else p.set('tab', t)
        return p
      },
      { replace: true },
    )

  const [f, setF] = useState<ProjectTaskFilters>(EMPTY_FILTERS)
  const [editing, setEditing] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newTask, setNewTask] = useState<{ status?: TaskStatus; dueDate?: string } | null>(null)

  // Toàn bộ việc của dự án (thống kê, nhãn đang dùng) + truy vấn đã lọc phía máy chủ
  const baseFilters = useMemo<TaskFilters>(() => ({ projectId: id }), [id])
  const serverFilters = useMemo<TaskFilters>(() => {
    const out: TaskFilters = { projectId: id }
    if (f.assignee && f.assignee !== 'none') out.assigneeId = f.assignee
    if (f.due) out.due = f.due
    if (f.label) out.label = f.label
    return out
  }, [id, f.assignee, f.due, f.label])
  const hasServerFilter = Object.keys(serverFilters).length > 1
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks(baseFilters, !!id)
  const { data: filteredTasks = [], isLoading: filteredLoading } = useTasks(serverFilters, !!id && hasServerFilter)
  const source = hasServerFilter ? filteredTasks : allTasks
  const loadingTasks = hasServerFilter ? filteredLoading : tasksLoading

  const tasks = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return source.filter(
      (t: Task) =>
        (f.assignee !== 'none' || !t.assigneeId) &&
        (!q || `${t.project.key}-${t.number} ${t.title}`.toLowerCase().includes(q)),
    )
  }, [source, f.q, f.assignee])

  const labels = useMemo(() => {
    const out = new Map<string, string>()
    for (const l of settings?.taskLabels ?? []) out.set(l.name, l.color)
    for (const t of allTasks) for (const l of t.labels) if (!out.has(l)) out.set(l, '#64748B')
    return [...out].map(([name, color]) => ({ name, color }))
  }, [settings, allTasks])

  if (isError) {
    return (
      <PageContainer>
        <PageTopbar crumbs={[{ label: 'Dự án', to: '/projects' }, { label: 'Không tìm thấy' }]} />
        <EmptyState
          icon={FolderX}
          title="Không tìm thấy dự án"
          description="Dự án có thể đã bị xoá hoặc bạn không có quyền xem."
          action={
            <Button variant="outline" asChild>
              <Link to="/projects">Về danh sách dự án</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  if (isLoading || !project) {
    return (
      <PageContainer wide>
        <PageTopbar crumbs={[{ label: 'Dự án', to: '/projects' }, { label: 'Đang tải…' }]} />
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="mt-6 h-10 w-full max-w-xl" />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={cn("h-80 rounded-[10px]", i > 1 && "hidden md:block")} />
          ))}
        </div>
      </PageContainer>
    )
  }

  const canEdit = isManager || project.members.some((m) => m.userId === user?.id && m.role === 'LEAD')
  const lead = projectLead(project)
  const isTaskTab = TASK_TABS.includes(tab)
  const filtering = !!(f.q || f.assignee || f.due || f.label)

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: 'Dự án', to: '/projects' }, { label: project.name }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setMembersOpen(true)} className="hidden sm:inline-flex">
              <UserPlus /> Mời thành viên
            </Button>
            <Button onClick={() => setNewTask({})}>
              <Plus /> Tạo việc
            </Button>
          </>
        }
      />

      {/* Đầu trang dự án */}
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <ProjectMark project={project} className="size-12 text-sm" />
        <div className="min-w-0 flex-1 basis-[280px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">{project.name}</h1>
            <ProjectStatusPill status={project.status} />
          </div>
          <div className="text-text-secondary mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
            <span className="num font-semibold">{project.key}</span>
            <span aria-hidden className="hidden sm:inline">•</span>
            {project.client ? (
              <Link to={`/clients/${project.client.id}`} className="hover:text-primary transition-colors">
                Khách hàng {project.client.name}
              </Link>
            ) : (
              <span>Dự án nội bộ</span>
            )}
            {lead && (
              <span className="hidden sm:contents">
                <span aria-hidden>•</span>
                <span>Trưởng dự án {lead.name}</span>
              </span>
            )}
            <span aria-hidden className="hidden sm:inline">•</span>
            <span>
              <span className="num">{project.stats.done}</span> trên <span className="num">{project.stats.total}</span> việc hoàn thành
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <ProjectProgress project={project} className="w-full max-w-xs" />
            <ProjectDue project={project} />
            {project.stats.overdue > 0 && (
              <button
                type="button"
                onClick={() => {
                  setF({ ...EMPTY_FILTERS, due: 'overdue' })
                  if (!isTaskTab) setTab('list')
                }}
                className="text-overdue-foreground cursor-pointer text-[13px] font-semibold hover:underline"
              >
                {project.stats.overdue} việc quá hạn
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="hover:bg-subtle focus-visible:ring-ring/50 cursor-pointer rounded-full p-1 transition-colors outline-none focus-visible:ring-2"
            aria-label={`${project.members.length} thành viên, bấm để quản lý`}
          >
            <AvatarStack users={project.members.map((m) => m.user)} max={5} />
          </button>
          <Button variant="outline" size="icon" onClick={() => setMembersOpen(true)} className="sm:hidden" aria-label="Mời thành viên">
            <UserPlus />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Tuỳ chọn dự án">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
                <UserPlus /> Thành viên
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem onSelect={() => setEditing(true)}>
                    <Pencil /> Sửa dự án
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                    <Trash2 /> Xoá dự án
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Thanh tab */}
      <div role="tablist" aria-label="Mục của dự án" className="-mx-4 mb-5 flex overflow-x-auto border-b px-4 md:mx-0 md:px-0">
        {TABS.map((t) => {
          const on = tab === t.value
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.value)}
              className={cn(
                'relative shrink-0 cursor-pointer px-3.5 py-2.5 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:bg-subtle',
                on ? 'text-primary' : 'text-text-secondary hover:text-foreground',
              )}
            >
              {t.label}
              {t.value === 'board' || t.value === 'list' ? (
                <span className={cn('num ml-1.5 text-xs', on ? 'text-primary' : 'text-muted-foreground')}>{allTasks.length || ''}</span>
              ) : null}
              <span
                className={cn('bg-primary absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-opacity', on ? 'opacity-100' : 'opacity-0')}
                aria-hidden
              />
            </button>
          )
        })}
      </div>

      {isTaskTab && (
        <div className="mb-5">
          <TaskFilterBar
            value={f}
            onChange={setF}
            members={project.members.map((m) => m.user)}
            labels={labels}
            meId={user?.id}
          />
        </div>
      )}

      {isTaskTab && loadingTasks ? (
        <div className="grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-subtle space-y-2.5 rounded-[10px] border p-2">
              <Skeleton className="m-1 h-5 w-24" />
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-28 rounded-[10px]" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {tab === 'board' && (
            <KanbanBoard
              tasks={tasks}
              filters={hasServerFilter ? serverFilters : baseFilters}
              onOpen={openTask}
              onAdd={(status) => setNewTask({ status })}
              projectId={project.id}
            />
          )}
          {tab === 'list' &&
            (tasks.length ? (
              <TaskTable tasks={tasks} onOpen={openTask} />
            ) : (
              <EmptyState
                icon={ListTodo}
                title={filtering ? 'Không có việc nào khớp bộ lọc' : 'Dự án chưa có công việc'}
                description={filtering ? 'Thử bỏ bớt điều kiện lọc.' : 'Tạo việc đầu tiên và giao cho thành viên.'}
                action={
                  filtering ? (
                    <Button variant="outline" onClick={() => setF(EMPTY_FILTERS)}>
                      Xoá bộ lọc
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setNewTask({})}>
                      <Plus /> Tạo việc
                    </Button>
                  )
                }
              />
            ))}
          {tab === 'calendar' && (
            <TaskCalendar
              tasks={tasks}
              onOpen={openTask}
              onAddOn={(d) => setNewTask({ dueDate: `${fmtDate(d, 'yyyy-MM-dd')}T17:00` })}
            />
          )}
        </>
      )}

      {tab === 'overview' && (
        <ProjectOverview
          project={project}
          tasks={allTasks}
          loading={tasksLoading}
          canEdit={canEdit}
          onMembers={() => setMembersOpen(true)}
        />
      )}
      {tab === 'files' && <FileLibrary projectId={project.id} />}
      {tab === 'discussions' && <DiscussionList projectId={project.id} />}

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
      <MembersDialog project={project} open={membersOpen} onOpenChange={setMembersOpen} canEdit={canEdit} />
      <TaskFormDialog
        open={!!newTask}
        onOpenChange={(o) => !o && setNewTask(null)}
        projectId={project.id}
        status={newTask?.status}
        dueDate={newTask?.dueDate}
      />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá dự án {project.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ {project.stats.total} công việc, bình luận và tệp của dự án sẽ bị xoá vĩnh viễn. Không thể hoàn tác. Nếu chỉ muốn ẩn,
              hãy chuyển trạng thái sang “Lưu trữ”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              disabled={del.isPending}
              onClick={() =>
                del.mutate(project.id, {
                  onSuccess: () => {
                    toast.success('Đã xoá dự án')
                    navigate('/projects')
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
