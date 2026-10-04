import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { NotificationItem } from '@/components/layout/notification-bell'
import { EmptyState } from '@/components/empty-state'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { useNotificationActions, useNotifications } from '@/features/notifications/api'
import type { Notification } from '@/types/api'

export function NotificationsPage() {
  const { data } = useNotifications()
  const { read, readAll } = useNotificationActions()
  const navigate = useNavigate()
  const onOpen = (n: Notification) => {
    if (!n.readAt) read.mutate(n.id)
    if (n.link) navigate(n.link)
  }
  return (
    <PageContainer>
      <PageHeader
        title="Thông báo"
        description={data ? `${data.unread} chưa đọc` : undefined}
        actions={
          <Button variant="outline" onClick={() => readAll.mutate()} disabled={!data?.unread}>
            <CheckCheck /> Đánh dấu tất cả đã đọc
          </Button>
        }
      />
      {data?.items.length ? (
        <div className="bg-card max-w-3xl space-y-0.5 rounded-xl border p-2">
          {data.items.map((n) => <NotificationItem key={n.id} n={n} onOpen={onOpen} />)}
        </div>
      ) : (
        <EmptyState icon={Bell} title="Chưa có thông báo" description="Bạn sẽ nhận thông báo khi được giao việc, được nhắc tên hoặc sắp đến hạn." />
      )}
    </PageContainer>
  )
}
