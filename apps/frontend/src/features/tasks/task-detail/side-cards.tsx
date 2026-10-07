import { Bell, BellOff, Clock, Eye, Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack, UserAvatar } from '@/components/user-avatar'
import { useAttachmentList } from '@/features/attachments'
import { useAuth } from '@/features/auth/use-auth'
import { errorMessage } from '@/lib/api'
import { STATUS_META } from '@/lib/constants'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TaskDetail, TaskStatus } from '@/types/api'
import { useTaskActivity, useWatchTask } from '../api'
import { FIELD_LABEL } from './meta'
import { SectionCard } from './section-card'

// ---------- Người theo dõi ----------
export function WatchersCard({ task }: { task: TaskDetail }) {
  const watch = useWatchTask(task.id)
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? task.watchers : task.watchers.slice(0, 5)
  return (
    <SectionCard
      title="Người theo dõi"
      size="M"
      aside={task.watchers.length > 0 && <AvatarStack users={task.watchers} max={4} />}
    >
      {task.watchers.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa ai theo dõi công việc này.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((u) => (
            <li key={u.id} className="flex items-center gap-2.5 text-sm">
              <UserAvatar user={u} className="size-6" />
              <span className="min-w-0 flex-1 truncate">{u.name}</span>
              {u.id === task.assigneeId && <span className="text-muted-foreground text-xs">Phụ trách</span>}
              {u.id === task.reporterId && u.id !== task.assigneeId && (
                <span className="text-muted-foreground text-xs">Người giao</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {task.watchers.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-primary mt-2 cursor-pointer text-[13px] font-semibold hover:underline"
        >
          {expanded ? 'Thu gọn' : `Xem tất cả ${task.watchers.length} người`}
        </button>
      )}
      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        Người theo dõi nhận thông báo khi đổi trạng thái hoặc có trao đổi mới.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={watch.isPending}
        onClick={() =>
          watch.mutate(!task.watching, {
            onSuccess: (t) => toast.success(t.watching ? 'Đã theo dõi công việc' : 'Đã bỏ theo dõi'),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      >
        {task.watching ? <BellOff className="size-4" strokeWidth={1.8} /> : <Bell className="size-4" strokeWidth={1.8} />}
        {task.watching ? 'Bỏ theo dõi' : 'Theo dõi công việc'}
      </Button>
    </SectionCard>
  )
}

// ---------- Nhắc hạn tự động ----------
type ReminderRow = { label: string; sentAt: string | null; plannedAt: Date | null }

export function RemindersCard({ task }: { task: TaskDetail }) {
  const { user } = useAuth()
  const [now] = useState(() => Date.now())
  const done = task.status === 'DONE'
  const due = task.dueDate ? new Date(task.dueDate) : null
  const r = task.reminders ?? { reminder24hSentAt: null, reminder2hSentAt: null, overdueNotifiedAt: null }
  const rows: ReminderRow[] = [
    { label: 'Nhắc trước 24 giờ', sentAt: r.reminder24hSentAt, plannedAt: due && new Date(due.getTime() - 24 * 3600e3) },
    { label: 'Nhắc trước 2 giờ', sentAt: r.reminder2hSentAt, plannedAt: due && new Date(due.getTime() - 2 * 3600e3) },
    { label: 'Báo quá hạn', sentAt: r.overdueNotifiedAt, plannedAt: due },
  ]
  const mine = user && user.id === task.assigneeId
  const off = mine ? [!user.remind24h && '24 giờ', !user.remind2h && '2 giờ'].filter(Boolean) : []

  return (
    <SectionCard title="Nhắc hạn tự động" icon={Clock} size="M">
      <p className="text-text-secondary text-sm leading-relaxed">
        Gửi nhắc người phụ trách trước hạn <strong className="text-foreground font-semibold">24 giờ</strong> và{' '}
        <strong className="text-foreground font-semibold">2 giờ</strong> qua thông báo trong web và email. Quá hạn sẽ báo cho
        cả người giao việc.
      </p>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => {
          const state = row.sentAt
            ? 'sent'
            : !due || done
              ? 'skip'
              : row.plannedAt && row.plannedAt.getTime() < now && row.label !== 'Báo quá hạn'
                ? 'missed'
                : 'pending'
          return (
            <li key={row.label} className="bg-subtle flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 text-[13px]">
              {state === 'sent' ? (
                <Pill tone="on-time">Đã gửi</Pill>
              ) : state === 'pending' ? (
                <Pill tone="primary">Đã lên lịch</Pill>
              ) : (
                <Pill tone="neutral">Không gửi</Pill>
              )}
              <span className="min-w-0 flex-1">
                {row.label}
                {state === 'sent' && row.sentAt && <>, {fmtDate(row.sentAt, 'dd/MM HH:mm')}</>}
                {state === 'pending' && row.plannedAt && (
                  <span className="text-muted-foreground"> · dự kiến {fmtDate(row.plannedAt, 'dd/MM HH:mm')}</span>
                )}
                {state === 'skip' && (
                  <span className="text-muted-foreground"> · {done ? 'đã hoàn thành' : 'chưa có hạn'}</span>
                )}
                {state === 'missed' && <span className="text-muted-foreground"> · hạn đặt quá sát</span>}
              </span>
            </li>
          )
        })}
      </ul>
      {!task.assigneeId && !done && (
        <p className="text-due-soon-foreground mt-3 text-xs font-medium">Chưa giao người phụ trách nên chưa có ai nhận nhắc.</p>
      )}
      {off.length > 0 && (
        <p className="text-muted-foreground mt-3 text-xs">Bạn đang tắt nhắc trước {off.join(' và ')}.</p>
      )}
      <Link
        to="/profile?tab=notifications"
        className="text-primary mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
      >
        <Settings2 className="size-3.5" strokeWidth={1.8} aria-hidden />
        Cài đặt nhận nhắc của bạn
      </Link>
    </SectionCard>
  )
}

// ---------- Nhật ký ----------
interface LogEntry {
  id: string
  text: string
  who: string
  at: string
  system?: boolean
}

function describe(action: string, meta: Record<string, unknown>) {
  switch (action) {
    case 'created':
      return 'Tạo công việc'
    case 'status_changed': {
      const to = meta.to as TaskStatus | undefined
      return to && STATUS_META[to] ? `Chuyển sang “${STATUS_META[to].label}”` : 'Đổi trạng thái'
    }
    case 'assigned':
      return 'Giao việc cho người phụ trách mới'
    case 'commented':
      return 'Thêm trao đổi'
    case 'updated': {
      const changes = (meta.changes as string[] | undefined)?.map((c) => FIELD_LABEL[c]).filter(Boolean)
      return changes?.length ? `Cập nhật ${changes.join(', ')}` : 'Cập nhật công việc'
    }
    default:
      return 'Cập nhật công việc'
  }
}

export function ActivityCard({ task }: { task: TaskDetail }) {
  const { data: activity, isLoading } = useTaskActivity(task.id)
  const { data: files = [] } = useAttachmentList('TASK', task.id)
  const [all, setAll] = useState(false)

  const entries = useMemo(() => {
    const list: LogEntry[] = []
    for (const a of activity ?? [])
      list.push({ id: a.id, text: describe(a.action, a.meta), who: a.actor?.name ?? 'Hệ thống', at: a.createdAt })
    for (const c of task.checklist ?? [])
      if (c.done && c.completedAt)
        list.push({ id: `c-${c.id}`, text: `Hoàn thành “${c.content}”`, who: c.completedBy?.name ?? 'Không rõ', at: c.completedAt })
    for (const f of files)
      list.push({
        id: `f-${f.id}`,
        text: f.version > 1 ? `Tải phiên bản v${f.version} của ${f.fileName}` : `Thêm tệp ${f.fileName}`,
        who: f.uploader.name,
        at: f.createdAt,
      })
    const r = task.reminders
    if (r?.reminder24hSentAt)
      list.push({ id: 'r24', text: 'Hệ thống gửi nhắc trước hạn 24 giờ', who: 'Tự động', at: r.reminder24hSentAt, system: true })
    if (r?.reminder2hSentAt && r.reminder2hSentAt !== r.reminder24hSentAt)
      list.push({ id: 'r2', text: 'Hệ thống gửi nhắc trước hạn 2 giờ', who: 'Tự động', at: r.reminder2hSentAt, system: true })
    if (r?.overdueNotifiedAt)
      list.push({ id: 'ro', text: 'Hệ thống báo quá hạn', who: 'Tự động', at: r.overdueNotifiedAt, system: true })
    return list.sort((a, b) => +new Date(b.at) - +new Date(a.at))
  }, [activity, files, task.checklist, task.reminders])

  const shown = all ? entries : entries.slice(0, 6)

  return (
    <SectionCard title="Nhật ký" size="M">
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có hoạt động nào.</p>
      ) : (
        <ol className="relative space-y-4">
          {shown.map((e, i) => (
            <li key={e.id} className="relative pl-5">
              <span
                className={cn(
                  'absolute top-[7px] left-0 size-2 rounded-full',
                  e.system ? 'bg-due-soon-foreground' : i === 0 ? 'bg-primary' : 'bg-border-strong',
                )}
                aria-hidden
              />
              {i < shown.length - 1 && <span className="bg-border absolute top-4 -bottom-4 left-[3.5px] w-px" aria-hidden />}
              <p className="text-[15px] leading-snug break-words">{e.text}</p>
              <p className="text-muted-foreground mt-0.5 text-[13px]" title={fmtDateTime(e.at)}>
                {e.who}, {fmtDate(e.at, 'dd/MM HH:mm')}
              </p>
            </li>
          ))}
        </ol>
      )}
      {entries.length > 6 && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="text-primary mt-4 inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold hover:underline"
        >
          <Eye className="size-3.5" strokeWidth={1.8} aria-hidden />
          {all ? 'Thu gọn' : `Xem toàn bộ ${entries.length} hoạt động`}
        </button>
      )}
    </SectionCard>
  )
}
