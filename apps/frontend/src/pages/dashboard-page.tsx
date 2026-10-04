import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, CheckCircle2, Gavel, ListTodo, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PageContainer, PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { DueDate, PriorityIcon } from '@/components/task-meta'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { ActivityFeed } from '@/features/activity-feed'
import { useAuth } from '@/features/auth/use-auth'
import { useTasks } from '@/features/tasks/api'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { useOpenTask } from '@/hooks/use-open-task'
import { get } from '@/lib/api'
import { STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import type { DashboardData } from '@/types/api'

function greeting() {
  const h = new Date().getHours()
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const openTask = useOpenTask()
  const [newTask, setNewTask] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => get<DashboardData>('/dashboard') })
  const { data: myTasks = [] } = useTasks({ assigneeId: 'me', includeDone: false })
  const upcoming = [...myTasks]
    .sort((a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity))
    .slice(0, 6)
  const totalTasks = data ? Object.values(data.byStatus).reduce((s, n) => s + (n ?? 0), 0) : 0

  return (
    <PageContainer wide>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(' ').slice(-1)[0]} 👋`}
        description={`Hôm nay là ${fmtDate(new Date(), "EEEE, 'ngày' d MMMM")}`}
        actions={
          <Button onClick={() => setNewTask(true)}>
            <Plus /> Công việc mới
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard icon={ListTodo} label="Việc đang làm" value={data.me.open} hint={`${data.me.dueThisWeek} việc đến hạn trong 7 ngày`} onClick={() => navigate('/my-tasks')} />
          <StatCard icon={AlertTriangle} label="Quá hạn" value={data.me.overdue} tone={data.me.overdue ? 'danger' : 'default'} hint={data.me.overdue ? 'Cần xử lý ngay' : 'Tuyệt vời, không có việc trễ'} onClick={() => navigate('/my-tasks')} />
          <StatCard icon={CheckCircle2} label="Xong tuần này" value={data.me.doneThisWeek} tone="success" hint={`${data.me.dueToday} việc đến hạn hôm nay`} />
          <StatCard
            icon={Target}
            label="Tỉ lệ đúng hạn (90 ngày)"
            value={data.onTime.rate === null ? '—' : `${data.onTime.rate}%`}
            tone={data.onTime.rate !== null && data.onTime.rate < 70 ? 'warning' : 'success'}
            hint={`${data.onTime.onTime} đúng hạn · ${data.onTime.late} trễ hạn, toàn đội`}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="text-primary size-4" /> Việc sắp đến hạn của tôi
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/my-tasks">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.map((t) => (
              <button key={t.id} type="button" onClick={() => openTask(t)} className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors">
                <span className="size-2 shrink-0 rounded-[2px]" style={{ background: t.project.color }} />
                <span className="text-muted-foreground w-16 shrink-0 font-mono text-xs">
                  {t.project.key}-{t.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                <PriorityIcon priority={t.priority} />
                <DueDate due={t.dueDate} className="w-28 justify-end" />
              </button>
            ))}
            {!upcoming.length && <p className="text-muted-foreground py-8 text-center text-sm">Bạn không có việc nào đang mở 🎉</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tổng quan công việc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data && (
              <>
                <div className="flex h-3 overflow-hidden rounded-full">
                  {TASK_STATUSES.map((s) => (
                    <div key={s} className={STATUS_META[s].dot} style={{ width: `${totalTasks ? ((data.byStatus[s] ?? 0) / totalTasks) * 100 : 0}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TASK_STATUSES.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-sm">
                      <span className={`size-2 rounded-full ${STATUS_META[s].dot}`} />
                      <span className="text-muted-foreground">{STATUS_META[s].label}</span>
                      <span className="ml-auto font-semibold tabular-nums">{data.byStatus[s] ?? 0}</span>
                    </div>
                  ))}
                </div>
                <Link to="/decisions" className="bg-primary/5 hover:bg-primary/10 flex items-center gap-3 rounded-lg p-3 transition-colors">
                  <Gavel className="text-primary size-5" />
                  <span className="text-sm">
                    <b>{data.openDecisions}</b> quyết định đang chờ ý kiến
                  </span>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Dự án đang chạy</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data?.projects.map((p) => {
              const pct = p.total ? Math.round((p.done / p.total) * 100) : 0
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="hover:border-primary/30 rounded-xl border p-4 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: p.color }}>
                      {p.key.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    {p.overdue > 0 && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">{p.overdue} trễ</span>}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={pct} className="h-1.5" />
                    <span className="text-muted-foreground text-xs tabular-nums">{pct}%</span>
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    {p.done}/{p.total} việc xong{p.dueDate && ` · hạn ${fmtDate(p.dueDate)}`}
                  </div>
                </Link>
              )
            })}
            {!data?.projects.length && <p className="text-muted-foreground col-span-2 py-6 text-center text-sm">Chưa có dự án nào đang chạy</p>}
          </CardContent>
        </Card>

        <Card className="row-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>{data && <ActivityFeed items={data.recentActivity} />}</CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Khối lượng & đúng hạn theo thành viên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.members.map((m) => {
              const finished = m.onTime + m.late
              const rate = finished ? Math.round((m.onTime / finished) * 100) : null
              return (
                <div key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[200px_1fr_90px_110px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <UserAvatar user={m} className="size-7" />
                    <span className="truncate text-sm font-medium">{m.name}</span>
                  </span>
                  <span className="hidden items-center gap-2 sm:flex">
                    <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <span className="bg-primary block h-full rounded-full" style={{ width: `${Math.min(100, m.open * 10)}%` }} />
                    </span>
                    <span className="text-muted-foreground w-14 text-xs tabular-nums">{m.open} việc</span>
                  </span>
                  <span className={`text-xs ${m.overdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>{m.overdue} quá hạn</span>
                  <span className="text-right text-xs">
                    {rate === null ? <span className="text-muted-foreground">Chưa có dữ liệu</span> : <span className={rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}>{rate}% đúng hạn</span>}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
      <TaskFormDialog open={newTask} onOpenChange={setNewTask} assigneeId={user?.id} />
    </PageContainer>
  )
}
