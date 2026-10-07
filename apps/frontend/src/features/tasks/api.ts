import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, del, get, patch, post } from '@/lib/api'
import type {
  Activity,
  ChecklistItem,
  Comment,
  Task,
  TaskDetail,
  TaskPriority,
  TaskStatus,
  WorkspaceSettings,
} from '@/types/api'

export interface TaskFilters {
  projectId?: string
  assigneeId?: string
  includeDone?: boolean
  dueFrom?: string
  dueTo?: string
  q?: string
  label?: string
  due?: 'overdue' | 'today' | 'week' | 'none'
  status?: TaskStatus
}

export function useTasks(filters: TaskFilters, enabled = true) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => v !== undefined && params.set(k, String(v)))
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => get<Task[]>(`/tasks?${params}`),
    enabled,
  })
}

// GET /tasks/:id trả về TaskDetail (người theo dõi, nhắc hạn); useTask giữ kiểu Task cho chỗ cũ
export const useTask = (id: string | null) =>
  useQuery({ queryKey: ['task', id], queryFn: () => get<TaskDetail>(`/tasks/${id}`), enabled: !!id })

export const useTaskDetail = (id: string | null | undefined) =>
  useQuery({ queryKey: ['task', id], queryFn: () => get<TaskDetail>(`/tasks/${id}`), enabled: !!id })

// Nhãn công việc (tên + màu) cấu hình trong Cài đặt
export const useWorkspaceSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: () => get<WorkspaceSettings>('/settings'), staleTime: 5 * 60_000 })

export function useTaskLabels() {
  const { data } = useWorkspaceSettings()
  const labels = data?.taskLabels ?? []
  const colorOf = (name: string) => labels.find((l) => l.name.toLowerCase() === name.toLowerCase())?.color
  return { labels, colorOf }
}

export const useTaskComments = (id: string) =>
  useQuery({ queryKey: ['task', id, 'comments'], queryFn: () => get<Comment[]>(`/tasks/${id}/comments`) })

export const useTaskActivity = (id: string) =>
  useQuery({ queryKey: ['task', id, 'activity'], queryFn: () => get<Activity[]>(`/tasks/${id}/activity`) })

export interface TaskInput {
  projectId?: string
  title?: string
  description?: string | null
  acceptanceCriteria?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
  startDate?: string | null
  labels?: string[]
  checklist?: string[]
}

function useInvalidateTasks() {
  const qc = useQueryClient()
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['projects'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    if (id) qc.invalidateQueries({ queryKey: ['task', id] })
  }
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: (data: TaskInput) => post<Task>('/tasks', data), onSuccess: () => invalidate() })
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: TaskInput & { id: string }) => patch<Task>(`/tasks/${id}`, data),
    onSuccess: (task) => {
      qc.setQueryData<Task>(['task', task.id], (old) => (old ? { ...old, ...task } : task))
      invalidate(task.id)
    },
  })
}

// Kéo thả Kanban: cập nhật ngay trên giao diện rồi mới gọi API
export function useMoveTask(filters: TaskFilters) {
  const qc = useQueryClient()
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: TaskStatus; position: number }) =>
      post<Task>(`/tasks/${id}/move`, { status, position }),
    onMutate: async ({ id, status, position }) => {
      const key = ['tasks', filters]
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Task[]>(key)
      qc.setQueryData<Task[]>(key, (old) => old?.map((t) => (t.id === id ? { ...t, status, position } : t)))
      return { prev, key }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (task) => invalidate(task?.id),
  })
}

// Theo dõi / bỏ theo dõi công việc
export function useWatchTask(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (watch: boolean) =>
      watch ? post<TaskDetail>(`/tasks/${id}/watch`) : api<TaskDetail>(`/tasks/${id}/watch`, { method: 'DELETE' }),
    onSuccess: (task) => qc.setQueryData(['task', id], task),
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: (id: string) => del(`/tasks/${id}`), onSuccess: () => invalidate() })
}

export function useChecklist(taskId: string) {
  const qc = useQueryClient()
  const invalidate = useInvalidateTasks()
  const done = () => invalidate(taskId)
  const key = ['task', taskId]
  // Cập nhật ngay trên giao diện (tick / sửa / xoá), lỗi thì hoàn tác
  const optimistic = async (fn: (items: ChecklistItem[]) => ChecklistItem[]) => {
    await qc.cancelQueries({ queryKey: key, exact: true })
    const prev = qc.getQueryData<Task>(key)
    if (prev) qc.setQueryData<Task>(key, { ...prev, checklist: fn(prev.checklist ?? []) })
    return { prev }
  }
  const rollback = (_e: unknown, _v: unknown, ctx?: { prev?: Task }) => ctx?.prev && qc.setQueryData(key, ctx.prev)
  return {
    add: useMutation({
      mutationFn: (content: string) => post<ChecklistItem>(`/tasks/${taskId}/checklist`, { content }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...data }: { id: string; done?: boolean; content?: string }) =>
        patch<ChecklistItem>(`/tasks/${taskId}/checklist/${id}`, data),
      onMutate: ({ id, ...data }) =>
        optimistic((items) => items.map((i) => (i.id === id ? { ...i, ...data } : i))),
      onError: rollback,
      onSettled: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => del(`/tasks/${taskId}/checklist/${id}`),
      onMutate: (id) => optimistic((items) => items.filter((i) => i.id !== id)),
      onError: rollback,
      onSettled: done,
    }),
  }
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { body: string; mentionIds: string[] }) => post<Comment>(`/tasks/${taskId}/comments`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  })
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del(`/tasks/${taskId}/comments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  })
}
