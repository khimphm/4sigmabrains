import { Bell, BellOff, CheckCheck, Loader2, Settings2 } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { NotificationItem } from '@/components/layout/notification-bell'
import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { groupByDay, useMarkNotifications, useUnreadNotifications } from '@/features/dashboard/notification-meta'
import { useNotifications } from '@/features/notifications/api'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/api'

export function NotificationsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'unread' ? 'unread' : 'all'
  const all = useNotifications()
  const unreadQ = useUnreadNotifications(tab === 'unread')
  const { read, readAll } = useMarkNotifications()
  const navigate = useNavigate()
  const list = tab === 'all' ? all : unreadQ
  const unread = all.data?.unread ?? 0
  const items = list.data?.items ?? []

  const onOpen = (n: Notification) => {
    if (!n.readAt) read.mutate(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <PageContainer>
      <PageTopbar
        crumbs={[{ label: 'Thông báo' }]}
        actions={
          <Button variant="outline" onClick={() => readAll.mutate()} disabled={!unread || readAll.isPending}>
            {readAll.isPending ? <Loader2 className="animate-spin" /> : <CheckCheck />}
            <span className="max-sm:sr-only">Đánh dấu tất cả đã đọc</span>
          </Button>
        }
      />
      <PageHeader
        title="Thông báo"
        description={unread ? `Bạn có ${unread} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo'}
        actions={
          <Button variant="ghost" asChild>
            <Link to="/profile">
              <Settings2 /> Tuỳ chỉnh thông báo
            </Link>
          </Button>
        }
      />

      <div className="bg-card shadow-card max-w-3xl overflow-hidden rounded-[10px] border">
        <div role="tablist" aria-label="Lọc thông báo" className="flex gap-5 border-b px-5">
          {(
            [
              ['all', 'Tất cả', all.data?.items.length],
              ['unread', 'Chưa đọc', unread],
            ] as const
          ).map(([v, label, count]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={tab === v}
              onClick={() =>
                setParams(
                  (p) => {
                    if (v === 'all') p.delete('tab')
                    else p.set('tab', v)
                    return p
                  },
                  { replace: true },
                )
              }
              className={cn(
                '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 pt-3.5 pb-3 text-[14px] font-semibold transition-colors outline-none focus-visible:underline',
                tab === v ? 'border-primary text-foreground' : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {label}
              {!!count && (
                <span className={cn('num rounded-full px-1.5 text-[12px]', v === 'unread' ? 'bg-primary-soft text-primary' : 'bg-subtle text-muted-foreground')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="p-2">
          {list.isLoading ? (
            <div className="space-y-4 p-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length ? (
            groupByDay(items).map((g) => (
              <section key={g.label} aria-label={g.label} className="mb-2 last:mb-0">
                <h2 className="text-muted-foreground px-4 pt-3 pb-1.5 text-[13px] font-semibold">
                  {g.label} <span className="num font-normal">· {g.items.length}</span>
                </h2>
                <div className="space-y-0.5">
                  {g.items.map((n) => (
                    <NotificationItem key={n.id} n={n} onOpen={onOpen} onMarkRead={(x) => read.mutate(x.id)} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <EmptyState
              className="m-3 border-none"
              icon={tab === 'unread' ? BellOff : Bell}
              title={tab === 'unread' ? 'Không còn thông báo chưa đọc' : 'Chưa có thông báo'}
              description="Bạn sẽ nhận thông báo khi được giao việc, được nhắc tên, có ý kiến mới hoặc việc sắp đến hạn."
              action={
                tab === 'unread' ? (
                  <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                    Xem tất cả thông báo
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
      {tab === 'all' && items.length >= 50 && (
        <p className="text-muted-foreground mt-3 max-w-3xl text-center text-[13px]">Hiển thị 50 thông báo gần nhất.</p>
      )}
    </PageContainer>
  )
}
