import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { get, patch, post } from '@/lib/api'
import type { DashboardData, TaskPriority, TaskStatus, User, UserRole, UserStatus } from '@/types/api'

// Thành viên nội bộ đang hoạt động; `all` (chỉ admin) gồm cả chờ duyệt, đã khoá và tài khoản khách hàng
export const useUsers = (all = false) =>
  useQuery({ queryKey: ['users', { all }], queryFn: () => get<User[]>(`/users${all ? '?all=true' : ''}`), staleTime: 60_000 })

export const useUser = (id?: string) =>
  useQuery({ queryKey: ['users', 'one', id], queryFn: () => get<User>(`/users/${id}`), enabled: !!id })

export interface MemberProfileTask {
  id: string
  number: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  projectId: string
  projectName: string
  projectKey: string
  projectColor: string
}

export interface MemberProfile {
  user: User
  stats: {
    done30: number
    donePrev30: number
    onTime: number
    late: number
    onTimeRate: number | null
    open: number
    overdue: number
  }
  openTasks: MemberProfileTask[]
}

export const useMemberProfile = (id?: string) =>
  useQuery({ queryKey: ['users', 'profile', id], queryFn: () => get<MemberProfile>(`/users/${id}/profile`), enabled: !!id })

// Số việc đang mở / quá hạn của từng người (lấy từ bảng làm việc, dùng chung cache ['dashboard'])
export function useMemberWorkload() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => get<DashboardData>('/dashboard'),
    staleTime: 60_000,
    select: (d) => new Map(d.members.map((m) => [m.id, m])),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<User>) => patch<User>('/users/me', data),
    onSuccess: (user) => {
      qc.setQueryData(['auth', 'me'], user)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export interface UpdateMemberInput {
  id: string
  role?: UserRole
  status?: UserStatus
  clientId?: string | null
  title?: string
  department?: string
}

// Admin: duyệt, đổi vai trò, khoá/mở khoá, gắn khách hàng, sửa chức danh/phòng ban
export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateMemberInput) => patch<User>(`/users/${id}`, data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['users'] })
      const prev = qc.getQueriesData<User[]>({ queryKey: ['users'] })
      qc.setQueriesData<unknown>({ queryKey: ['users'] }, (old: unknown) =>
        Array.isArray(old) ? (old as User[]).map((u) => (u.id === id ? { ...u, ...data } : u)) : old,
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export interface InviteInput {
  email: string
  name: string
  role?: UserRole
  clientId?: string | null
  title?: string
  projectIds?: string[]
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InviteInput) => post<{ user: User; inviteLink: string | null }>('/auth/invite', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
