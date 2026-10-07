import { isToday, isYesterday } from 'date-fns'
import {
  ArrowRightLeft,
  CheckCircle2,
  FileUp,
  MessageSquare,
  PencilLine,
  Plus,
  RotateCcw,
  Stamp,
  Trash2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { UserAvatar } from '@/components/user-avatar'
import { STATUS_META } from '@/lib/constants'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Activity, TaskStatus } from '@/types/api'

const ENTITY_LABEL: Record<Activity['entityType'], string> = {
  project: 'dự án',
  task: 'việc',
  discussion: 'thảo luận',
  decision: 'chủ đề',
  user: 'thành viên',
  file: 'tệp',
  drawing: 'bản vẽ',
  client: 'khách hàng',
}

function describe(a: Activity): { icon: LucideIcon; text: string; tone?: string } {
  const what = ENTITY_LABEL[a.entityType]
  switch (a.action) {
    case 'created':
      return { icon: Plus, text: `tạo ${what}` }
    case 'status_changed': {
      const to = a.meta.to as TaskStatus | undefined
      return {
        icon: ArrowRightLeft,
        text: to && STATUS_META[to] ? `chuyển sang “${STATUS_META[to].label}”` : 'đổi trạng thái',
      }
    }
    case 'assigned':
      return { icon: UserPlus, text: `giao ${what}` }
    case 'commented':
      return { icon: MessageSquare, text: 'bình luận vào' }
    case 'deleted':
      return { icon: Trash2, text: `xoá ${what}`, tone: 'text-overdue-foreground' }
    case 'decided':
      return { icon: Stamp, text: 'đóng dấu chốt', tone: 'text-seal' }
    case 'reopened':
      return { icon: RotateCcw, text: 'mở lại' }
    case 'uploaded':
      return { icon: FileUp, text: 'tải lên' }
    case 'completed':
      return { icon: CheckCircle2, text: `hoàn thành ${what}`, tone: 'text-on-time-foreground' }
    default:
      return { icon: PencilLine, text: `cập nhật ${what}` }
  }
}

function linkFor(a: Activity) {
  if (a.action === 'deleted') return null
  if (a.entityType === 'task') return `/tasks/${a.entityId}`
  if (a.entityType === 'project') return `/projects/${a.entityId}`
  if (a.entityType === 'discussion') return `/discussions/${a.entityId}`
  if (a.entityType === 'decision') return `/decisions/${a.entityId}`
  if (a.entityType === 'file') return a.projectId ? `/files?projectId=${a.projectId}` : '/files'
  if (a.entityType === 'drawing') return `/dataset/drawings/${a.entityId}`
  if (a.entityType === 'client') return `/clients/${a.entityId}`
  if (a.entityType === 'user') return `/members/${a.entityId}`
  return null
}

// "Hôm nay, 08:30" · "Hôm qua, 15:42" · "28/09, 08:30" (năm khác thì kèm năm)
export function activityTime(d: string) {
  const date = new Date(d)
  if (isToday(date)) return `Hôm nay, ${fmtDate(date, 'HH:mm')}`
  if (isYesterday(date)) return `Hôm qua, ${fmtDate(date, 'HH:mm')}`
  if (date.getFullYear() === new Date().getFullYear()) return fmtDate(date, 'dd/MM, HH:mm')
  return fmtDate(date, 'dd/MM/yyyy, HH:mm')
}

export function ActivityFeed({ items, compact, className }: { items: Activity[]; compact?: boolean; className?: string }) {
  if (!items.length) return <p className="text-muted-foreground py-6 text-center text-sm">Chưa có hoạt động nào</p>
  return (
    <ol className={cn('relative', compact ? 'space-y-3' : 'space-y-4', className)}>
      {items.map((a, i) => {
        const { icon: Icon, text, tone } = describe(a)
        const link = linkFor(a)
        const last = i === items.length - 1
        return (
          <li key={a.id} className="relative flex gap-3">
            {!last && <span aria-hidden className="bg-border absolute top-9 -bottom-3 left-[15px] w-px" />}
            <span className="relative shrink-0">
              {a.actor ? (
                <UserAvatar user={a.actor} className="size-8" />
              ) : (
                <span className="bg-subtle text-text-secondary grid size-8 place-items-center rounded-full">
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
              )}
              {a.actor && (
                <span
                  aria-hidden
                  className={cn(
                    'bg-card ring-card absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full ring-2',
                    tone ?? 'text-text-secondary',
                  )}
                >
                  <Icon className="size-3" strokeWidth={2} />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1 text-[14px] leading-5">
              <p className="text-foreground">
                <span className="font-semibold">{a.actor?.name ?? 'Hệ thống'}</span>{' '}
                <span className="text-text-secondary">{text}</span>
                {!compact && (
                  <>
                    {' '}
                    {link ? (
                      <Link
                        to={link}
                        className="hover:text-primary focus-visible:text-primary font-medium underline-offset-2 transition-colors outline-none hover:underline focus-visible:underline"
                      >
                        {a.summary}
                      </Link>
                    ) : (
                      <span className="font-medium">{a.summary}</span>
                    )}
                  </>
                )}
              </p>
              <time dateTime={a.createdAt} title={fmtDateTime(a.createdAt)} className="text-muted-foreground num mt-0.5 block text-[13px]">
                {activityTime(a.createdAt)}
              </time>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
