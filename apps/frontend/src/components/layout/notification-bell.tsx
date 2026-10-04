import { Bell, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserAvatar } from '@/components/user-avatar'
import { useNotificationActions, useNotifications } from '@/features/notifications/api'
import { fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/api'

export function NotificationItem({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn('hover:bg-muted/70 flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors', !n.readAt && 'bg-primary/5')}
    >
      {n.actor ? (
        <UserAvatar user={n.actor} className="size-8" />
      ) : (
        <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
          <Bell className="size-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm">{n.title}</span>
        {n.body && <span className="text-muted-foreground line-clamp-1 text-xs">{n.body}</span>}
        <span className="text-muted-foreground mt-0.5 block text-[11px]">{fromNow(n.createdAt)}</span>
      </span>
      {!n.readAt && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
    </button>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const { read, readAll } = useNotificationActions()
  const navigate = useNavigate()

  const onOpen = (n: Notification) => {
    if (!n.readAt) read.mutate(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Thông báo">
          <Bell className="size-[18px]" />
          {!!data?.unread && (
            <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {data.unread > 99 ? '99+' : data.unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">Thông báo</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => readAll.mutate()} disabled={!data?.unread}>
            <CheckCheck className="size-3.5" />
            Đánh dấu đã đọc
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1">
          {data?.items.slice(0, 15).map((n) => <NotificationItem key={n.id} n={n} onOpen={onOpen} />)}
          {!data?.items.length && <p className="text-muted-foreground py-10 text-center text-sm">Chưa có thông báo nào</p>}
        </div>
        <Link to="/notifications" onClick={() => setOpen(false)} className="text-primary block border-t py-2.5 text-center text-sm font-medium hover:underline">
          Xem tất cả
        </Link>
      </PopoverContent>
    </Popover>
  )
}
