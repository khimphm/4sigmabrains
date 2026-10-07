import { FileText, History, MessagesSquare, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AttachmentList } from '@/components/attachment-list'
import { EmptyState } from '@/components/empty-state'
import { PageContainer } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack } from '@/components/user-avatar'
import { UserSelect } from '@/components/user-select'
import { type TaskView, ViewSwitcher } from '@/components/view-switcher'
import { ActivityFeed } from '@/features/activity-feed'
import { useAuth } from '@/features/auth/use-auth'
import { useDiscussions } from '@/features/discussions/api'
import { useDeleteProject, useProject, useProjectActivity } from '@/features/projects/api'
import { MembersDialog } from '@/features/projects/members-dialog'
import { ProjectFormDialog } from '@/features/projects/project-form-dialog'
import { useTasks } from '@/features/tasks/api'
import { KanbanBoard } from '@/features/tasks/kanban-board'
import { TaskCalendar } from '@/features/tasks/task-calendar'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { TaskTable } from '@/features/tasks/task-table'
import { useOpenTask } from '@/hooks/use-open-task'
import { errorMessage } from '@/lib/api'
import { PROJECT_STATUS_META } from '@/lib/constants'
import { fmtDate, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/api'

type Tab = TaskView | 'discussions' | 'files' | 'activity'

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, isManager } = useAuth()
  const { data: project, isLoading } = useProject(id)
  const filters = useMemo(() => ({ projectId: id }), [id])
  const { data: tasks = [] } = useTasks(filters, !!id)
  const openTask = useOpenTask()
  const del = useDeleteProject()

  const [tab, setTab] = useState<Tab>('board')
  const [search, setSearch] = useState('')
  const [assignee, setAssignee] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [members, setMembers] = useState(false)
  const [newTask, setNewTask] = useState<{ status?: TaskStatus; dueDate?: string } | null>(null)

  const filtered = tasks.filter(
    (t) => (!assignee || t.assigneeId === assignee) && (!search || `${t.project.key}-${t.number} ${t.title}`.toLowerCase().includes(search.toLowerCase())),
  )

  if (isLoading || !project) {
    return (
      <PageContainer wide>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="mt-6 h-96 rounded-xl" />
      </PageContainer>
    )
  }

  const canEdit = isManager || project.members.some((m) => m.userId === user?.id && m.role === 'LEAD')
  const pct = project.stats.total ? Math.round((project.stats.done / project.stats.total) * 100) : 0
  const isTaskView = tab === 'board' || tab === 'list' || tab === 'calendar'

  return (
    <PageContainer wide>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white shadow-md" style={{ background: project.color }}>
          {project.key.slice(0, 2)}
        </span>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PROJECT_STATUS_META[project.status].badge)}>
              {PROJECT_STATUS_META[project.status].label}
            </span>
          </div>
          {project.description && <p className="text-muted-foreground mt-1 max-w-3xl text-sm">{project.description}</p>}
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="flex items-center gap-2">
              <Progress value={pct} className="h-1.5 w-28" />
              {pct}% · {project.stats.done}/{project.stats.total} việc
            </span>
            {project.stats.overdue > 0 && <span className="font-medium text-red-600">{project.stats.overdue} việc quá hạn</span>}
            {project.dueDate && <span>Hạn: {fmtDate(project.dueDate)}</span>}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button type="button" onClick={() => setMembers(true)} className="flex items-center gap-2 rounded-full p-1 transition hover:bg-muted">
            <AvatarStack users={project.members.map((m) => m.user)} />
          </button>
          <Button onClick={() => setNewTask({})}>
            <Plus /> Công việc
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Tuỳ chọn">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMembers(true)}>
                <Users /> Thành viên
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <Pencil /> Sửa dự án
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (!confirm(`Xoá dự án ${project.name} và toàn bộ công việc? Không thể hoàn tác.`)) return
                      del.mutate(project.id, {
                        onSuccess: () => (toast.success('Đã xoá dự án'), navigate('/projects')),
                        onError: (e) => toast.error(errorMessage(e)),
                      })
                    }}
                  >
                    <Trash2 /> Xoá dự án
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 border-b pb-3">
        <ViewSwitcher value={isTaskView ? (tab as TaskView) : ('' as TaskView)} onChange={setTab} />
        <div className="bg-muted inline-flex rounded-lg p-1">
          {(
            [
              ['discussions', 'Thảo luận', MessagesSquare],
              ['files', 'Tài liệu', FileText],
              ['activity', 'Hoạt động', History],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTab(v)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                tab === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        {isTaskView && (
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Lọc công việc…" className="h-9 w-full pl-8 sm:w-48" />
            </div>
            <UserSelect className="h-9 w-36 sm:w-44" value={assignee} onChange={setAssignee} placeholder="Mọi người" />
          </div>
        )}
      </div>

      {tab === 'board' && <KanbanBoard tasks={filtered} filters={filters} onOpen={openTask} onAdd={(status) => setNewTask({ status })} />}
      {tab === 'list' &&
        (filtered.length ? (
          <TaskTable tasks={filtered} onOpen={openTask} />
        ) : (
          <EmptyState icon={Plus} title="Chưa có công việc" action={<Button onClick={() => setNewTask({})}>Tạo công việc</Button>} />
        ))}
      {tab === 'calendar' && (
        <TaskCalendar tasks={filtered} onOpen={openTask} onAddOn={(d) => setNewTask({ dueDate: `${fmtDate(d, 'yyyy-MM-dd')}T17:00` })} />
      )}
      {tab === 'discussions' && <ProjectDiscussions projectId={project.id} />}
      {tab === 'files' && (
        <div className="max-w-3xl">
          <AttachmentList target="PROJECT" targetId={project.id} />
        </div>
      )}
      {tab === 'activity' && <ProjectActivity projectId={project.id} />}

      <ProjectFormDialog open={editing} onOpenChange={setEditing} project={project} />
      <MembersDialog project={project} open={members} onOpenChange={setMembers} canEdit={canEdit} />
      <TaskFormDialog
        open={!!newTask}
        onOpenChange={(o) => !o && setNewTask(null)}
        projectId={project.id}
        status={newTask?.status}
        dueDate={newTask?.dueDate}
      />
    </PageContainer>
  )
}

function ProjectDiscussions({ projectId }: { projectId: string }) {
  const { data = [] } = useDiscussions(projectId)
  return (
    <div className="max-w-3xl space-y-2">
      <Button variant="outline" asChild>
        <Link to={`/discussions?new=1&projectId=${projectId}`}>
          <Plus /> Chủ đề mới
        </Link>
      </Button>
      {data.map((d) => (
        <Link key={d.id} to={`/discussions/${d.id}`} className="bg-card hover:border-primary/30 block rounded-xl border p-4 transition-all hover:shadow-sm">
          <div className="font-medium">{d.title}</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {d.author.name} · {d.replyCount} trả lời · {fromNow(d.lastActivityAt)}
          </div>
        </Link>
      ))}
      {!data.length && <p className="text-muted-foreground py-8 text-center text-sm">Chưa có thảo luận trong dự án này</p>}
    </div>
  )
}

function ProjectActivity({ projectId }: { projectId: string }) {
  const { data = [] } = useProjectActivity(projectId)
  return (
    <div className="max-w-3xl">
      <ActivityFeed items={data} />
    </div>
  )
}
