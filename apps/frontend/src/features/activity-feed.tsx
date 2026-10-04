import { CheckCircle2, MessageSquare, PencilLine, Plus, Trash2, UserPlus, Gavel, ArrowRightLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { UserAvatar } from '@/components/user-avatar'
import { STATUS_META } from '@/lib/constants'
import { fromNow } from '@/lib/format'
import type { Activity, TaskStatus } from '@/types/api'

const ENTITY_LABEL = { project: 'dự án', task: 'công việc', discussion: 'thảo luận', decision: 'quyết định', user: 'thành viên' }

function describe(a: Activity) {
  const what = ENTITY_LABEL[a.entityType]
  switch (a.action) {
    case 'created':
      return { icon: Plus, text: `tạo ${what}` }
    case 'status_changed': {
      const to = a.meta.to as TaskStatus | undefined
      return { icon: ArrowRightLeft, text: to && STATUS_META[to] ? `chuyển sang "${STATUS_META[to].label}"` : 'đổi trạng thái' }
    }
    case 'assigned':
      return { icon: UserPlus, text: 'giao việc' }
    case 'commented':
      return { icon: MessageSquare, text: 'bình luận' }
    case 'deleted':
      return { icon: Trash2, text: `xoá ${what}` }
    case 'decided':
      return { icon: Gavel, text: `chốt phương án "${String(a.meta.option ?? '')}"` }
    case 'completed':
      return { icon: CheckCircle2, text: 'hoàn thành' }
    default:
      return { icon: PencilLine, text: `cập nhật ${what}` }
  }
}

function linkFor(a: Activity) {
  if (a.action === 'deleted') return null
  if (a.entityType === 'task' && a.projectId) return `/projects/${a.projectId}?task=${a.entityId}`
  if (a.entityType === 'project') return `/projects/${a.entityId}`
  if (a.entityType === 'discussion') return `/discussions/${a.entityId}`
  if (a.entityType === 'decision') return `/decisions/${a.entityId}`
  return null
}

export function ActivityFeed({ items, compact }: { items: Activity[]; compact?: boolean }) {
  if (!items.length) return <p className="text-muted-foreground py-6 text-center text-sm">Chưa có hoạt động nào</p>
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-border">
      {items.map((a) => {
        const { icon: Icon, text } = describe(a)
        const link = linkFor(a)
        return (
          <li key={a.id} className="relative flex gap-3">
            {a.actor ? (
              <UserAvatar user={a.actor} className="ring-background size-7 ring-4" />
            ) : (
              <span className="bg-muted ring-background grid size-7 place-items-center rounded-full ring-4">
                <Icon className="size-3.5" />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5 text-sm">
              <span className="font-medium">{a.actor?.name ?? 'Hệ thống'}</span>{' '}
              <span className="text-muted-foreground">{text}</span>
              {!compact && (
                <>
                  {' '}
                  {link ? (
                    <Link to={link} className="font-medium hover:underline">
                      {a.summary}
                    </Link>
                  ) : (
                    <span className="font-medium">{a.summary}</span>
                  )}
                </>
              )}
              <div className="text-muted-foreground text-xs">{fromNow(a.createdAt)}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
