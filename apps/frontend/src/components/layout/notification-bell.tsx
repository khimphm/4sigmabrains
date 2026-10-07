import { Bell, BellOff, Check, CheckCheck, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { activityTime } from '@/features/dashboard/time'
import { groupByDay, notificationMeta, useMarkNotifications, useUnreadNotifications } from '@/features/dashboard/notification-meta'
import { useNotifications } from '@/features/notifications/api'
import { fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/api'

// Một dòng thông báo: biểu tượng theo loại (hoặc ảnh người gây ra + huy hiệu loại), tiêu đề, nội dung, thời gian
export function NotificationItem({
  n,
  onOpen,
  onMarkRead,
  compact,
}: {
  n: Notification
  onOpen: (n: Notification) => void
  onMarkRead?: (n: Notification) => void
  compact?: boolean
}) {
  const meta = notificationMeta(n.type)
  const Icon = meta.icon
  const unread = !n.readAt
  return (
    <div className={cn('group relative rounded-lg transition-colors duration-150', unread ? 'bg-primary-soft/50' : '', 'hover:bg-subtle')}>
      <button
        type="button"
        onClick={() => onOpen(n)}
        className={cn(
          'focus-visible:ring-ring/50 flex w-full cursor-pointer gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px]',
          compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
          onMarkRead && unread && 'pr-12',
        )}
      >
        <span className="relative mt-0.5 shrink-0">
          {n.actor ? (
            <>
              <UserAvatar user={n.actor} className={compact ? 'size-8' : 'size-9'} />
              <span
                aria-hidden
                className={cn('ring-card absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full ring-2', meta.tone)}
              >
                <Icon className="size-2.5" strokeWidth={2.2} />
              </span>
            </>
          ) : (
            <span className={cn('grid place-items-center rounded-full', meta.tone, compact ? 'size-8' : 'size-9')} aria-hidden>
              <Icon className="size-4" strokeWidth={1.8} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('line-clamp-2 text-[14px] leading-5', unread ? 'text-foreground font-semibold' : 'text-text-secondary')}>
            {n.title}
          </span>
          {n.body && (
            <span className={cn('text-muted-foreground mt-0.5 block text-[13px] leading-5', compact ? 'line-clamp-1' : 'line-clamp-2')}>
              {n.body}
            </span>
          )}
          <span className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[12px]">
            <span className="font-medium">{meta.label}</span>
            <span aria-hidden>·</span>
            <time dateTime={n.createdAt} title={fmtDateTime(n.createdAt)}>
              {compact ? fromNow(n.createdAt) : activityTime(n.createdAt)}
            </time>
            {unread && <span className="sr-only">, chưa đọc</span>}
          </span>
        </span>
        {unread && !onMarkRead && <span aria-hidden className="bg-primary mt-2 size-2 shrink-0 rounded-full" />}
      </button>
      {unread && onMarkRead && (
        <>
          <span aria-hidden className="bg-primary absolute top-1/2 right-4 size-2 -translate-y-1/2 rounded-full transition-opacity max-md:hidden group-focus-within:opacity-0 group-hover:opacity-0" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
            onClick={() => onMarkRead(n)}
            aria-label={`Đánh dấu đã đọc: ${n.title}`}
            title="Đánh dấu đã đọc"
          >
            <Check className="size-4" />
          </Button>
        </>
      )}
    </div>
  )
}

type Tab = 'all' | 'unread'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const all = useNotifications()
  const unreadQ = useUnreadNotifications(open && tab === 'unread')
  const { read, readAll } = useMarkNotifications()
  const navigate = useNavigate()
  const unread = all.data?.unread ?? 0
  const list = tab === 'all' ? all : unreadQ
  const items = (list.data?.items ?? []).slice(0, 20)

  const onOpen = (n: Notification) => {
    if (!n.readAt) read.mutate(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        >
          <Bell className="size-[18px]" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="bg-overdue-foreground text-card ring-card num absolute top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold ring-2">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="shadow-pop w-[min(400px,calc(100vw-16px))] overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
          <span className="text-[17px] font-bold">Thông báo</span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[13px]"
              onClick={() => readAll.mutate()}
              disabled={!unread || readAll.isPending}
            >
              <CheckCheck className="size-4" /> Đọc tất cả
            </Button>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/profile" onClick={() => setOpen(false)} aria-label="Cài đặt thông báo" title="Cài đặt thông báo">
                <Settings2 className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div role="tablist" aria-label="Lọc thông báo" className="flex gap-4 border-b px-4">
          {(
            [
              ['all', 'Tất cả'],
              ['unread', 'Chưa đọc'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={tab === v}
              onClick={() => setTab(v)}
              className={cn(
                '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 pt-1 pb-2 text-[13px] font-semibold transition-colors outline-none focus-visible:underline',
                tab === v ? 'border-primary text-foreground' : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {label}
              {v === 'unread' && unread > 0 && (
                <span className="bg-primary-soft text-primary num rounded-full px-1.5 text-[11px]">{unread}</span>
              )}
            </button>
          ))}
        </div>
        <div className="max-h-[min(460px,65vh)] overflow-y-auto overscroll-contain p-1.5" role="tabpanel">
          {list.isLoading ? (
            <div className="space-y-3 p-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-4/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length ? (
            groupByDay(items).map((g) => (
              <div key={g.label} className="mb-1 last:mb-0">
                <div className="text-muted-foreground px-3 pt-2 pb-1 text-[12px] font-semibold">{g.label}</div>
                {g.items.map((n) => (
                  <NotificationItem key={n.id} n={n} onOpen={onOpen} compact />
                ))}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="bg-subtle text-muted-foreground grid size-10 place-items-center rounded-full">
                <BellOff className="size-5" strokeWidth={1.8} />
              </span>
              <p className="text-[14px] font-semibold">{tab === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo nào'}</p>
              <p className="text-muted-foreground max-w-60 text-[13px]">Bạn sẽ được báo khi được giao việc, nhắc tên hoặc sắp đến hạn.</p>
            </div>
          )}
        </div>
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="text-primary hover:bg-subtle focus-visible:bg-subtle block border-t py-2.5 text-center text-[13px] font-semibold transition-colors outline-none"
        >
          Xem tất cả thông báo
        </Link>
      </PopoverContent>
    </Popover>
  )
}
