import { isAfter } from 'date-fns'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Crown,
  Flag,
  ListTodo,
  Mail,
  Phone,
  Timer,
  UserCog,
  UserRound,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { DeadlineBadge } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { ActivityFeed } from '@/features/activity-feed'
import { useProjectActivity } from '@/features/projects/api'
import { ProjectDue, ProjectProgress } from '@/features/projects/project-parts'
import { PROJECT_ROLE_LABEL, projectLead } from '@/features/projects/project-utils'
import { useOpenTask } from '@/hooks/use-open-task'
import { STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Project, Task } from '@/types/api'

function Section({ title, action, children, className }: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-card shadow-card rounded-[10px] border', className)}>
      <header className="flex min-h-12 items-center gap-2 border-b px-4 py-2.5">
        <h3 className="text-[15px] font-bold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Stat({ icon: Icon, label, value, hint, tone }: {
  icon: typeof ListTodo
  label: string
  value: ReactNode
  hint?: ReactNode
  tone: 'primary' | 'on-time' | 'overdue' | 'due-soon'
}) {
  const toneClass = {
    primary: 'bg-primary-soft text-primary',
    'on-time': 'bg-on-time text-on-time-foreground',
    overdue: 'bg-overdue text-overdue-foreground',
    'due-soon': 'bg-due-soon text-due-soon-foreground',
  }[tone]
  return (
    <div className="bg-card shadow-card rounded-[10px] border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-secondary text-[13px] font-semibold">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-md', toneClass)}>
          <Icon className="size-4" strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      <div className="num mt-2 text-[32px] leading-none font-extrabold tracking-tight">{value}</div>
      {hint && <div className="text-muted-foreground mt-2 text-xs">{hint}</div>}
    </div>
  )
}

export function ProjectOverview({ project, tasks, loading, canEdit, onMembers }: {
  project: Project
  tasks: Task[]
  loading: boolean
  canEdit: boolean
  onMembers: () => void
}) {
  const openTask = useOpenTask()
  const { data: activity = [], isLoading: actLoading } = useProjectActivity(project.id)

  const [now] = useState(() => new Date())
  const s = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'DONE')
    const withDue = done.filter((t) => t.dueDate)
    const onTime = withDue.filter((t) => t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate!)).length
    const overdue = tasks.filter((t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now)
    const upcoming = tasks
      .filter((t) => t.status !== 'DONE' && t.dueDate && isAfter(new Date(t.dueDate), now))
      .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))
    const byStatus = Object.fromEntries(TASK_STATUSES.map((st) => [st, tasks.filter((t) => t.status === st).length]))
    return {
      total: tasks.length,
      done: done.length,
      onTime,
      late: withDue.length - onTime,
      rate: withDue.length ? Math.round((onTime / withDue.length) * 100) : null,
      overdue,
      upcoming,
      byStatus,
    }
  }, [tasks, now])

  const lead = projectLead(project)
  const members = [...project.members].sort((a, b) => (a.role === b.role ? 0 : a.role === 'LEAD' ? -1 : 1))
  const milestones = [...s.overdue.slice(0, 3), ...s.upcoming].slice(0, 7)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[118px] rounded-[10px]" />)
          ) : (
            <>
              <Stat icon={ListTodo} label="Tổng việc" value={s.total} hint={`${s.total - s.done} việc đang mở`} tone="primary" />
              <Stat
                icon={CheckCircle2}
                label="Hoàn thành"
                value={s.done}
                hint={`${s.total ? Math.round((s.done / s.total) * 100) : 0}% khối lượng`}
                tone="on-time"
              />
              <Stat
                icon={AlertTriangle}
                label="Quá hạn"
                value={s.overdue.length}
                hint={s.overdue.length ? 'Cần xử lý ngay' : 'Không có việc trễ'}
                tone="overdue"
              />
              <Stat
                icon={Timer}
                label="Đúng hạn"
                value={s.rate === null ? '—' : `${s.rate}%`}
                hint={s.rate === null ? 'Chưa có việc xong có hạn' : `${s.onTime} đúng hạn · ${s.late} trễ hạn`}
                tone="due-soon"
              />
            </>
          )}
        </div>

        <Section title="Tiến độ theo trạng thái">
          <ProjectProgress project={project} />
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-subtle" aria-hidden>
            {TASK_STATUSES.map((st) =>
              s.byStatus[st] ? (
                <div key={st} className={cn('h-full', STATUS_META[st].dot)} style={{ width: `${(s.byStatus[st] / (s.total || 1)) * 100}%` }} />
              ) : null,
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TASK_STATUSES.map((st) => (
              <div key={st} className="flex items-center gap-2 text-[13px]">
                <span className={cn('size-2 rounded-full', STATUS_META[st].dot)} aria-hidden />
                <span className="text-text-secondary">{STATUS_META[st].label}</span>
                <span className="num ml-auto font-semibold sm:ml-0">{s.byStatus[st]}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Mô tả dự án">
          {project.description ? (
            <p className="text-text-secondary text-[15px] leading-relaxed whitespace-pre-line">{project.description}</p>
          ) : (
            <p className="text-muted-foreground text-sm">Chưa có mô tả. {canEdit && 'Bấm “Sửa dự án” trong menu để thêm phạm vi và mục tiêu.'}</p>
          )}
        </Section>

        <Section title="Mốc sắp tới" action={<span className="text-muted-foreground text-xs">Việc chưa xong theo hạn chót</span>}>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : milestones.length ? (
            <ol className="relative space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-border">
              {milestones.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openTask(t)}
                    className="hover:bg-subtle relative flex w-full cursor-pointer items-center gap-3 rounded-md py-2 pr-2 text-left transition-colors"
                  >
                    <span className="bg-card relative z-10 grid size-6 shrink-0 place-items-center rounded-full border">
                      <Flag className="text-muted-foreground size-3" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.title}</span>
                      <span className="text-muted-foreground num block text-xs">
                        {t.project.key}-{t.number} · {fmtDate(t.dueDate, 'HH:mm, dd/MM/yyyy')}
                        {t.assignee && ` · ${t.assignee.name}`}
                      </span>
                    </span>
                    <DeadlineBadge due={t.dueDate} className="hidden sm:inline-flex" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">Không có việc nào sắp đến hạn.</p>
          )}
        </Section>

        <Section title="Hoạt động gần đây">
          {actLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <ActivityFeed items={activity.slice(0, 15)} compact />
          )}
        </Section>
      </div>

      <aside className="space-y-5">
        <Section title="Khách hàng">
          {project.client ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-primary-soft text-primary grid size-10 place-items-center rounded-md">
                  <Building2 className="size-5" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0">
                  <Link to={`/clients/${project.client.id}`} className="hover:text-primary block truncate font-semibold transition-colors">
                    {project.client.name}
                  </Link>
                  {project.client.contactName && (
                    <span className="text-muted-foreground block truncate text-xs">Liên hệ: {project.client.contactName}</span>
                  )}
                </div>
              </div>
              {(project.client.email || project.client.phone) && (
                <div className="text-text-secondary space-y-1.5 text-[13px]">
                  {project.client.email && (
                    <a href={`mailto:${project.client.email}`} className="hover:text-primary flex items-center gap-2 truncate transition-colors">
                      <Mail className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
                      {project.client.email}
                    </a>
                  )}
                  {project.client.phone && (
                    <a href={`tel:${project.client.phone}`} className="hover:text-primary flex items-center gap-2 transition-colors">
                      <Phone className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
                      {project.client.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Dự án nội bộ, chưa gắn khách hàng.</p>
          )}
        </Section>

        <Section title="Thông tin">
          <dl className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground flex items-center gap-1.5">
                <UserRound className="size-3.5" strokeWidth={1.8} aria-hidden /> Trưởng dự án
              </dt>
              <dd className="flex min-w-0 items-center gap-1.5 font-semibold">
                {lead && <UserAvatar user={lead} className="size-5" />}
                <span className="truncate">{lead?.name ?? '—'}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Bắt đầu</dt>
              <dd className="num font-semibold">{project.startDate ? fmtDate(project.startDate) : '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Hạn hoàn thành</dt>
              <dd>
                <ProjectDue project={project} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Ngày tạo</dt>
              <dd className="num font-semibold">{fmtDate(project.createdAt)}</dd>
            </div>
          </dl>
        </Section>

        <Section
          title={`Thành viên · ${project.members.length}`}
          action={
            <Button variant="ghost" size="sm" onClick={onMembers}>
              <UserCog /> {canEdit ? 'Quản lý' : 'Xem'}
            </Button>
          }
        >
          <ul className="space-y-2.5">
            {members.slice(0, 8).map((m) => (
              <li key={m.userId} className="flex items-center gap-3">
                <UserAvatar user={m.user} className="size-8" />
                <div className="min-w-0 flex-1">
                  <Link to={`/members/${m.userId}`} className="hover:text-primary block truncate text-sm font-semibold transition-colors">
                    {m.user.name}
                  </Link>
                  <span className="text-muted-foreground block truncate text-xs">{m.user.title || PROJECT_ROLE_LABEL[m.role]}</span>
                </div>
                {m.role === 'LEAD' && (
                  <span className="bg-due-soon text-due-soon-foreground inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold">
                    <Crown className="size-3" aria-hidden /> Trưởng
                  </span>
                )}
              </li>
            ))}
          </ul>
          {members.length > 8 && (
            <button type="button" onClick={onMembers} className="text-primary mt-3 cursor-pointer text-sm font-medium hover:underline">
              Xem tất cả {members.length} người
            </button>
          )}
        </Section>
      </aside>
    </div>
  )
}
