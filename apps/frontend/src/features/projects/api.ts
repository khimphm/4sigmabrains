import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { Activity, Client, Project, ProjectRole, WorkspaceSettings } from '@/types/api'

export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: () => get<Project[]>('/projects') })

export const useProject = (id?: string) =>
  useQuery({ queryKey: ['projects', id], queryFn: () => get<Project>(`/projects/${id}`), enabled: !!id })

export const useProjectActivity = (id: string) =>
  useQuery({ queryKey: ['projects', id, 'activity'], queryFn: () => get<Activity[]>(`/projects/${id}/activity`) })

export interface ProjectInput {
  name: string
  key?: string
  description?: string
  color?: string
  status?: Project['status']
  startDate?: string | null
  dueDate?: string | null
  memberIds?: string[]
  clientId?: string | null
}

export function useSaveProject(id?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjectInput) => (id ? patch<Project>(`/projects/${id}`, data) : post<Project>('/projects', data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useProjectMembers(projectId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] })
  return {
    add: useMutation({
      // Nhận danh sách id hoặc { userIds, role } để mời kèm vai trò
      mutationFn: (input: string[] | { userIds: string[]; role?: ProjectRole }) =>
        post(`/projects/${projectId}/members`, Array.isArray(input) ? { userIds: input } : input),
      onSuccess: invalidate,
    }),
    setRole: useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
        patch(`/projects/${projectId}/members/${userId}`, { role }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (userId: string) => del(`/projects/${projectId}/members/${userId}`),
      onSuccess: invalidate,
    }),
  }
}

// Khách hàng (dùng cho ô chọn khách hàng của dự án)
export const useClientOptions = () =>
  useQuery({ queryKey: ['clients'], queryFn: () => get<Client[]>('/clients'), staleTime: 60_000 })

// Cài đặt workspace: nhãn công việc kèm màu
export const useWorkspaceSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: () => get<WorkspaceSettings>('/settings'), staleTime: 5 * 60_000 })
