import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'

import { get, post } from '@/lib/api'
import type { Notification } from '@/types/api'

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => get<{ items: Notification[]; unread: number }>('/notifications'),
    refetchInterval: 120_000,
  })

export function useNotificationActions() {
  const qc = useQueryClient()
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['notifications'] })
  return {
    read: useMutation({ mutationFn: (id: string) => post(`/notifications/${id}/read`), onSuccess }),
    readAll: useMutation({ mutationFn: () => post('/notifications/read-all'), onSuccess }),
  }
}

// Nhận thông báo thời gian thực qua Socket.IO
export function useRealtimeNotifications(onOpen: (link: string) => void) {
  const qc = useQueryClient()
  useEffect(() => {
    const socket = io({ path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] })
    socket.on('notification', (n: Notification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(n.title, {
        description: n.body ?? undefined,
        action: n.link ? { label: 'Xem', onClick: () => onOpen(n.link!) } : undefined,
      })
    })
    return () => {
      socket.disconnect()
    }
  }, [qc, onOpen])
}
