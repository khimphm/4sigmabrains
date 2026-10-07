import { addHours, isAfter, isBefore } from 'date-fns'
import { ArrowRight, CalendarCheck2, CheckCircle2, FolderKanban, Plus, Scale, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer } from '@/components/page-header'
import { DeadlineBadge, Pill } from '@/components/pill'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { ActivityFeed } from '@/features/activity-feed'
import { useAuth } from '@/features/auth/use-auth'
import { useDashboard, useToggleTaskDone } from '@/features/dashboard/api'
import { ProjectDot, SectionCard } from '@/features/dashboard/section-card'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardData, DashboardTodayTask } from '@/types/api'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

// Số việc chưa xong đến hạn trong N giờ tới
function dueWithinHours(tasks: DashboardTodayTask[], hours: number) {
  const now = new Date()
  return tasks.filter(
    (t) => t.status !== 'DONE' && t.dueDate && isAfter(new Date(t.dueDate), now) && isBefore(new Date(t.dueDate), addHours(now, hours)),
  ).length
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function summaryLine(data: DashboardData | undefined) {
  const date = capitalize(fmtDate(new Date(), 'EEEE, dd/MM/yyyy'))
  if (!data) return `${date}.`
  const today = data.me.dueToday + data.me.overdue
  if (!today) return `${date}. Bạn không có việc nào đến hạn hôm nay.`
  return `${date}. Bạn có ${today} việc hôm nay${data.me.overdue ? `, trong đó ${data.me.overdue} việc đã quá hạn` : ''}.`
}

export function DashboardPage() {
  const { user, isManager } = useAuth()
  const navigate = useNavigate()
  const [newTask, setNewTask] = useState(false)
  const { data, isLoading } = useDashboard()

  const soon = data ? dueWithinHours(data.today, 4) : 0
  const doneToday = data?.today.filter((t) => t.status === 'DONE').length ?? 0
  const monthTotal = data ? data.month.onTime + data.month.late : 0

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: 'Bảng làm việc' }]}
        actions={
          <Button onClick={() => setNewTask(true)}>
            <Plus /> Tạo việc
          </Button>
        }
      />

      <div className="mb-6">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">
          {greeting()}, {user?.name}
        </h1>
        <p className="text-text-secondary mt-1.5 text-[15px]">{summaryLine(data)}</p>
      </div>

      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Việc hôm nay"
              value={data.me.dueToday + data.me.overdue}
              hint={soon ? `${soon} việc đến hạn trong 4 giờ tới` : doneToday ? `Đã xong ${doneToday} việc hôm nay` : 'Đến hạn hôm nay và quá hạn'}
              onClick={() => navigate('/my-tasks')}
            />
            <StatCard
              label="Quá hạn"
              value={data.me.overdue}
              tone={data.me.overdue ? 'danger' : 'default'}
              hint={data.me.overdue ? 'Người giao việc đã được báo' : 'Không có việc trễ hạn'}
              onClick={() => navigate('/my-tasks')}
            />
            <StatCard
              label="Sắp đến hạn"
              value={data.me.dueSoon}
              tone={data.me.dueSoon ? 'warning' : 'default'}
              hint="Trong 3 ngày tới"
              onClick={() => navigate('/my-tasks')}
            />
            <StatCard
              label="Đúng hạn tháng này"
              value={data.month.rate === null ? '—' : `${data.month.rate}%`}
              tone={data.month.rate === null ? 'default' : data.month.rate >= 80 ? 'success' : data.month.rate >= 60 ? 'warning' : 'danger'}
              hint={monthTotal ? `${data.month.onTime} trên ${monthTotal} việc · ${data.month.late} trễ` : 'Chưa có việc hoàn thành'}
              onClick={() => navigate('/reports')}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-6">
              <TodayTasks tasks={data.today} />
              <SectionCard id="activity" title="Hoạt động gần đây">
                <ActivityFeed items={data.recentActivity.slice(0, 10)} />
              </SectionCard>
            </div>
            <div className="min-w-0 space-y-6">
              <RunningProjects projects={data.projects} />
              <PendingDecisions items={data.pendingDecisions} />
              {isManager && <TeamWorkload members={data.members} />}
            </div>
          </div>
        </>
      )}
      <TaskFormDialog open={newTask} onOpenChange={setNewTask} assigneeId={user?.id} />
    </PageContainer>
  )
}

function TodayTasks({ tasks }: { tasks: DashboardTodayTask[] }) {
  const toggle = useToggleTaskDone()
  const left = tasks.filter((t) => t.status !== 'DONE').length
  return (
    <SectionCard
      id="today"
      title="Việc cần làm hôm nay"
      aside={tasks.length ? (left ? `Còn ${left} việc chưa xong` : 'Đã xong tất cả') : undefined}
      bodyClassName="pb-2"
    >
      {tasks.length ? (
        <ul className="border-border divide-border divide-y border-t">
          {tasks.map((t) => {
            const done = t.status === 'DONE'
            const code = `${t.project.key}-${t.number}`
            return (
              <li key={t.id} className="group relative flex items-center gap-3 py-3">
                <Checkbox
                  checked={done}
                  onCheckedChange={(v) =>
                    toggle.mutate({ id: t.id, status: v ? 'DONE' : 'TODO', code, prevStatus: t.status })
                  }
                  aria-label={done ? `Mở lại việc ${t.title}` : `Đánh dấu hoàn thành: ${t.title}`}
                  className="size-[18px] cursor-pointer"
                />
                <Link
                  to={`/tasks/${t.id}`}
                  className="hover:bg-subtle focus-visible:ring-ring/50 -my-1.5 -mr-2 flex min-w-0 flex-1 flex-col items-start gap-2 rounded-md sm:flex-row sm:items-center sm:gap-3 px-2 py-1.5 transition-colors duration-150 outline-none focus-visible:ring-[3px]"
                >
                  <span className="w-full min-w-0 flex-1">
                    <span
                      className={cn(
                        'line-clamp-2 text-[15px] font-semibold sm:line-clamp-1',
                        done && 'text-muted-foreground decoration-muted-foreground line-through',
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px]">
                      <ProjectDot color={t.project.color} />
                      <span className="num shrink-0 font-medium">{code}</span>
                      <span className="truncate">trong {t.project.name}</span>
                    </span>
                  </span>
                  {done ? (
                    <Pill tone="on-time" icon={CheckCircle2}>
                      Đã xong
                    </Pill>
                  ) : (
                    <DeadlineBadge due={t.dueDate} />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="border-border flex flex-col items-center border-t py-10 text-center">
          <span className="bg-on-time text-on-time-foreground mb-3 grid size-10 place-items-center rounded-full">
            <CalendarCheck2 className="size-5" strokeWidth={1.8} />
          </span>
          <p className="text-[15px] font-semibold">Hôm nay bạn không có việc đến hạn</p>
          <p className="text-muted-foreground mt-1 text-[13px]">Xem các việc sắp tới để chuẩn bị trước.</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/my-tasks">
              Mở Việc của tôi <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </SectionCard>
  )
}

function RunningProjects({ projects }: { projects: DashboardData['projects'] }) {
  return (
    <SectionCard
      id="projects"
      title="Dự án đang chạy"
      aside={
        <Link to="/projects" className="text-primary rounded-sm font-semibold hover:underline focus-visible:underline">
          Xem tất cả
        </Link>
      }
    >
      {projects.length ? (
        <ul className="space-y-1">
          {projects.map((p) => {
            const pct = p.total ? Math.round((p.done / p.total) * 100) : 0
            return (
              <li key={p.id}>
                <Link
                  to={`/projects/${p.id}`}
                  className="hover:bg-subtle focus-visible:ring-ring/50 -mx-2 block rounded-md px-2 py-2.5 transition-colors duration-150 outline-none focus-visible:ring-[3px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{p.name}</span>
                    {p.overdue > 0 && (
                      <Pill tone="overdue" className="h-5 px-1.5 text-[11px]">
                        {p.overdue} quá hạn
                      </Pill>
                    )}
                    <span className="text-text-secondary num text-[13px] font-medium">{pct}%</span>
                  </div>
                  <div
                    className="bg-subtle mt-2 h-1.5 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tiến độ ${p.name}`}
                  >
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                  <div className="text-muted-foreground mt-2 text-[13px] leading-5">
                    {p.clientName ? `${p.clientName}` : 'Nội bộ'}, {p.done} trên {p.total} việc
                    {p.dueDate && `, hạn ${fmtDate(p.dueDate, 'dd/MM')}`}
                  </div>
                  {p.leadName && (
                    <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-[12px]">
                      <UserAvatar user={{ name: p.leadName }} className="size-4 text-[7px]" />
                      Phụ trách: <span className="text-text-secondary font-medium">{p.leadName}</span>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <SmallEmpty icon={FolderKanban} text="Chưa có dự án nào đang chạy" />
      )}
    </SectionCard>
  )
}

function PendingDecisions({ items }: { items: DashboardData['pendingDecisions'] }) {
  return (
    <SectionCard
      id="pending"
      title="Đang chờ chốt"
      aside={
        items.length ? (
          <Pill tone="primary" className="h-6">
            {items.length} chủ đề
          </Pill>
        ) : undefined
      }
    >
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((d) => (
            <li key={d.id}>
              <Link
                to={`/decisions/${d.id}`}
                className="hover:border-border-strong hover:bg-subtle/60 focus-visible:ring-ring/50 block rounded-lg border px-3.5 py-3 transition-colors duration-150 outline-none focus-visible:ring-[3px]"
              >
                <span className="line-clamp-2 text-[15px] font-semibold">{d.title}</span>
                <span className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1.5 text-[13px]">
                  {d.projectName && <ProjectDot color={d.color} />}
                  <span className="truncate">
                    {d.opinions} ý kiến{d.dueDate ? `, hạn chốt ${fmtDate(d.dueDate, 'dd/MM')}` : ''}
                    {d.projectName ? ` · ${d.projectName}` : ''}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <SmallEmpty icon={Scale} text="Không có chủ đề nào đang chờ chốt" />
      )}
    </SectionCard>
  )
}

function TeamWorkload({ members }: { members: DashboardData['members'] }) {
  const max = Math.max(1, ...members.map((m) => m.open))
  return (
    <SectionCard
      id="team"
      title="Khối lượng của đội"
      aside={
        <Link to="/reports" className="text-primary font-semibold hover:underline focus-visible:underline">
          Báo cáo
        </Link>
      }
    >
      {members.length ? (
        <ul className="space-y-3">
          {members.slice(0, 8).map((m) => (
            <li key={m.id}>
              <Link
                to={`/members/${m.id}`}
                className="hover:bg-subtle focus-visible:ring-ring/50 -mx-2 flex items-center gap-2.5 rounded-md px-2 py-1 transition-colors outline-none focus-visible:ring-[3px]"
              >
                <UserAvatar user={m} className="size-7" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate font-semibold">{m.name}</span>
                    <span className="text-muted-foreground num shrink-0">
                      {m.open} mở
                      {m.overdue > 0 && <span className="text-overdue-foreground font-semibold"> · {m.overdue} quá hạn</span>}
                    </span>
                  </span>
                  <span className="bg-subtle mt-1 flex h-1.5 overflow-hidden rounded-full" aria-hidden>
                    <span className="bg-primary h-full" style={{ width: `${((m.open - m.overdue) / max) * 100}%` }} />
                    <span className="bg-overdue-foreground h-full" style={{ width: `${(m.overdue / max) * 100}%` }} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <SmallEmpty icon={Users} text="Chưa có thành viên" />
      )}
    </SectionCard>
  )
}

function SmallEmpty({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-[13px]">
      <Icon className="size-5" strokeWidth={1.8} />
      {text}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card shadow-card rounded-[10px] border px-5 py-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-14" />
            <Skeleton className="mt-3 h-3.5 w-36" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="bg-card shadow-card space-y-4 rounded-[10px] border p-5">
          <Skeleton className="h-5 w-48" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-[18px] rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
        <div className="bg-card shadow-card space-y-4 rounded-[10px] border p-5">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
