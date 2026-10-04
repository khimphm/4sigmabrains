import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { Activity, Project, ProjectRole } from '@/types/api'

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
      mutationFn: (userIds: string[]) => post(`/projects/${projectId}/members`, { userIds }),
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
