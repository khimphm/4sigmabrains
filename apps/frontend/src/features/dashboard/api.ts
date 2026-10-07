import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { errorMessage, get, patch } from '@/lib/api'
import type { DashboardData, Task, TaskStatus } from '@/types/api'

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => get<DashboardData>('/dashboard'), refetchInterval: 120_000 })

interface ToggleInput {
  id: string
  status: TaskStatus
  /** Mã hiển thị trong thông báo, vd BV-108 */
  code?: string
  /** Trạng thái trước đó, để "Hoàn tác" trả về đúng cột */
  prevStatus?: TaskStatus
}

// Đánh dấu xong / mở lại một việc: cập nhật ngay trên giao diện rồi mới gọi API
export function useToggleTaskDone() {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, status }: ToggleInput) => patch<Task>(`/tasks/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      await Promise.all([qc.cancelQueries({ queryKey: ['tasks'] }), qc.cancelQueries({ queryKey: ['dashboard'] })])
      const tasks = qc.getQueriesData({ queryKey: ['tasks'] })
      const dashboard = qc.getQueryData<DashboardData>(['dashboard'])
      const completedAt = status === 'DONE' ? new Date().toISOString() : null
      qc.setQueriesData({ queryKey: ['tasks'] }, (old: unknown) =>
        Array.isArray(old) ? (old as Task[]).map((t) => (t.id === id ? { ...t, status, completedAt } : t)) : old,
      )
      if (dashboard)
        qc.setQueryData<DashboardData>(['dashboard'], {
          ...dashboard,
          today: dashboard.today.map((t) => (t.id === id ? { ...t, status, completedAt } : t)),
        })
      return { tasks, dashboard }
    },
    onError: (e, _v, ctx) => {
      ctx?.tasks.forEach(([key, data]) => qc.setQueryData(key, data))
      if (ctx?.dashboard) qc.setQueryData(['dashboard'], ctx.dashboard)
      toast.error(errorMessage(e))
    },
    onSuccess: (task, { status, code, prevStatus }) => {
      qc.setQueryData(['task', task.id], (old: unknown) => (old ? { ...(old as object), ...task } : old))
      if (status === 'DONE')
        toast.success(code ? `Đã hoàn thành ${code}` : 'Đã hoàn thành công việc', {
          action: {
            label: 'Hoàn tác',
            onClick: () => mutation.mutate({ id: task.id, status: prevStatus && prevStatus !== 'DONE' ? prevStatus : 'TODO' }),
          },
        })
    },
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['task', id] })
    },
  })
  return mutation
}
