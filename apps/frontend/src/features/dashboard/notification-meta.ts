import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isToday, isYesterday } from 'date-fns'
import {
  AlertTriangle,
  ArrowRightLeft,
  AtSign,
  BadgeCheck,
  Bell,
  CheckCheck,
  Clock,
  Eye,
  FolderPlus,
  MessageSquare,
  MessagesSquare,
  Scale,
  ScanSearch,
  Share2,
  Stamp,
  UserPlus,
  UserRoundPlus,
  type LucideIcon,
} from 'lucide-react'

import { toast } from 'sonner'

import { errorMessage, get, post } from '@/lib/api'
import type { Notification } from '@/types/api'

// Theo enum NotificationType ở backend (notification.entity.ts)
export const NOTIFICATION_META: Record<string, { icon: LucideIcon; label: string; tone: string }> = {
  TASK_ASSIGNED: { icon: UserPlus, label: 'Giao việc', tone: 'bg-primary-soft text-primary' },
  TASK_DUE_SOON: { icon: Clock, label: 'Sắp đến hạn', tone: 'bg-due-soon text-due-soon-foreground' },
  TASK_OVERDUE: { icon: AlertTriangle, label: 'Quá hạn', tone: 'bg-overdue text-overdue-foreground' },
  TASK_STATUS_CHANGED: { icon: ArrowRightLeft, label: 'Đổi trạng thái', tone: 'bg-neutral text-neutral-foreground' },
  TASK_COMMENTED: { icon: MessageSquare, label: 'Bình luận', tone: 'bg-primary-soft text-primary' },
  MENTIONED: { icon: AtSign, label: 'Nhắc tên', tone: 'bg-primary-soft text-primary' },
  DISCUSSION_REPLY: { icon: MessagesSquare, label: 'Thảo luận', tone: 'bg-neutral text-neutral-foreground' },
  DECISION_CREATED: { icon: Scale, label: 'Chủ đề cần chốt', tone: 'bg-primary-soft text-primary' },
  DECISION_MADE: { icon: Stamp, label: 'Đã chốt', tone: 'bg-seal text-white' },
  PROJECT_ADDED: { icon: FolderPlus, label: 'Dự án', tone: 'bg-on-time text-on-time-foreground' },
  MEMBER_PENDING: { icon: UserRoundPlus, label: 'Chờ duyệt', tone: 'bg-due-soon text-due-soon-foreground' },
  ACCOUNT_APPROVED: { icon: BadgeCheck, label: 'Tài khoản', tone: 'bg-on-time text-on-time-foreground' },
  TASK_WATCHED: { icon: Eye, label: 'Đang theo dõi', tone: 'bg-neutral text-neutral-foreground' },
  FILE_SHARED: { icon: Share2, label: 'Chia sẻ tệp', tone: 'bg-primary-soft text-primary' },
  DRAWING_REVIEW: { icon: ScanSearch, label: 'Duyệt bản vẽ', tone: 'bg-due-soon text-due-soon-foreground' },
  DRAWING_REVIEWED: { icon: CheckCheck, label: 'Đã duyệt bản vẽ', tone: 'bg-on-time text-on-time-foreground' },
}

export const notificationMeta = (type: string) =>
  NOTIFICATION_META[type] ?? { icon: Bell, label: 'Thông báo', tone: 'bg-neutral text-neutral-foreground' }

// Gom theo Hôm nay / Hôm qua / Trước đó
export function groupByDay(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [
    { label: 'Hôm nay', items: [] },
    { label: 'Hôm qua', items: [] },
    { label: 'Trước đó', items: [] },
  ]
  for (const n of items) {
    const d = new Date(n.createdAt)
    groups[isToday(d) ? 0 : isYesterday(d) ? 1 : 2].items.push(n)
  }
  return groups.filter((g) => g.items.length)
}

// Danh sách chưa đọc (khóa con của ['notifications'] nên tự làm mới cùng)
export const useUnreadNotifications = (enabled = true) =>
  useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => get<{ items: Notification[]; unread: number }>('/notifications?unread=true'),
    enabled,
  })

type Inbox = { items: Notification[]; unread: number }

// Đánh dấu đã đọc: cập nhật ngay trên giao diện, lỗi thì hoàn lại
export function useMarkNotifications() {
  const qc = useQueryClient()
  const optimistic = async (id: string | null) => {
    await qc.cancelQueries({ queryKey: ['notifications'] })
    const snaps = qc.getQueriesData<Inbox>({ queryKey: ['notifications'] })
    const now = new Date().toISOString()
    qc.setQueriesData<Inbox>({ queryKey: ['notifications'] }, (old) => {
      if (!old?.items) return old
      const wasUnread = id ? old.items.some((n) => n.id === id && !n.readAt) : false
      return {
        items: old.items.map((n) => (!n.readAt && (id === null || n.id === id) ? { ...n, readAt: now } : n)),
        unread: id === null ? 0 : Math.max(0, old.unread - (wasUnread ? 1 : 0)),
      }
    })
    return { snaps }
  }
  const rollback = (e: unknown, ctx?: { snaps: [readonly unknown[], Inbox | undefined][] }) => {
    ctx?.snaps.forEach(([k, d]) => qc.setQueryData(k, d))
    toast.error(errorMessage(e))
  }
  const settle = () => qc.invalidateQueries({ queryKey: ['notifications'] })
  return {
    read: useMutation({
      mutationFn: (id: string) => post(`/notifications/${id}/read`),
      onMutate: (id) => optimistic(id),
      onError: (e, _v, ctx) => rollback(e, ctx),
      onSettled: settle,
    }),
    readAll: useMutation({
      mutationFn: () => post('/notifications/read-all'),
      onMutate: () => optimistic(null),
      onError: (e, _v, ctx) => rollback(e, ctx),
      onSuccess: () => toast.success('Đã đánh dấu tất cả là đã đọc'),
      onSettled: settle,
    }),
  }
}
