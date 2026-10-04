import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { Activity, ChecklistItem, Comment, Task, TaskPriority, TaskStatus } from '@/types/api'

export interface TaskFilters {
  projectId?: string
  assigneeId?: string
  includeDone?: boolean
  dueFrom?: string
  dueTo?: string
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

export const useTask = (id: string | null) =>
  useQuery({ queryKey: ['task', id], queryFn: () => get<Task>(`/tasks/${id}`), enabled: !!id })

export const useTaskComments = (id: string) =>
  useQuery({ queryKey: ['task', id, 'comments'], queryFn: () => get<Comment[]>(`/tasks/${id}/comments`) })

export const useTaskActivity = (id: string) =>
  useQuery({ queryKey: ['task', id, 'activity'], queryFn: () => get<Activity[]>(`/tasks/${id}/activity`) })

export interface TaskInput {
  projectId?: string
  title?: string
  description?: string | null
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
      qc.setQueryData(['task', task.id], task)
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

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({ mutationFn: (id: string) => del(`/tasks/${id}`), onSuccess: () => invalidate() })
}

export function useChecklist(taskId: string) {
  const invalidate = useInvalidateTasks()
  const done = () => invalidate(taskId)
  return {
    add: useMutation({
      mutationFn: (content: string) => post<ChecklistItem>(`/tasks/${taskId}/checklist`, { content }),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...data }: { id: string; done?: boolean; content?: string }) =>
        patch<ChecklistItem>(`/tasks/${taskId}/checklist/${id}`, data),
      onSuccess: done,
    }),
    remove: useMutation({ mutationFn: (id: string) => del(`/tasks/${taskId}/checklist/${id}`), onSuccess: done }),
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
