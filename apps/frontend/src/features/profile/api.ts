import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { TaskPriority, TaskStatus, User } from '@/types/api'

export type OAuthProvider = 'google' | 'microsoft' | 'github'

// GET /users/:id/profile
export interface ProfileOpenTask {
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

export interface UserProfile {
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
  openTasks: ProfileOpenTask[]
}

// GET /auth/methods
export interface LoginMethods {
  email: string
  password: boolean
  totpEnabled: boolean
  linked: Record<OAuthProvider, boolean>
  available: Record<OAuthProvider, boolean> & { password: boolean; emailEnabled: boolean; allowedDomains: string[] }
}

// GET /auth/sessions
export interface LoginSession {
  id: string
  userId: string
  userAgent: string | null
  ip: string | null
  method: string
  createdAt: string
  lastSeenAt: string
  revokedAt: string | null
  current: boolean
}

export interface TotpSetup {
  secret: string
  otpauthUrl: string
  qrDataUrl: string
}

export type ProfilePatch = Partial<
  Pick<
    User,
    | 'name'
    | 'title'
    | 'department'
    | 'phone'
    | 'bio'
    | 'skills'
    | 'emailNotifications'
    | 'webNotifications'
    | 'remind24h'
    | 'remind2h'
  >
>

const METHODS_KEY = ['auth', 'methods']
const SESSIONS_KEY = ['auth', 'sessions']

export const useUserProfile = (id: string | undefined) =>
  useQuery({
    queryKey: ['users', id, 'profile'],
    queryFn: () => get<UserProfile>(`/users/${id}/profile`),
    enabled: !!id,
  })

// Lưu hồ sơ; cập nhật ngay vào ['auth','me'] để các toggle phản hồi tức thì
export function useSaveProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfilePatch) => patch<User>('/users/me', data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['auth', 'me'] })
      const prev = qc.getQueryData<User | null>(['auth', 'me'])
      if (prev) qc.setQueryData(['auth', 'me'], { ...prev, ...data })
      return { prev }
    },
    onError: (_e, _d, ctx) => {
      if (ctx?.prev) qc.setQueryData(['auth', 'me'], ctx.prev)
    },
    onSuccess: (user) => {
      qc.setQueryData(['auth', 'me'], user)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useLoginMethods = () =>
  useQuery({ queryKey: METHODS_KEY, queryFn: () => get<LoginMethods>('/auth/methods') })

export function useUnlinkProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: OAuthProvider) => deleteJson<LoginMethods>(`/auth/link/${provider}`),
    onSuccess: (m) => qc.setQueryData(METHODS_KEY, m),
  })
}

// DELETE trả về JSON (danh sách cách đăng nhập mới)
async function deleteJson<T>(path: string) {
  const res = await fetch(`/api${path}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message)
    } catch {
      /* giữ statusText */
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

// Liên kết = chuyển hẳn trang sang luồng OAuth khi đang đăng nhập
export const linkProvider = (provider: OAuthProvider) => {
  window.location.href = `/api/auth/${provider}`
}

export function useChangePassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { currentPassword?: string; newPassword: string }) => post<void>('/auth/password', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: METHODS_KEY }),
  })
}

export const useSetupTotp = () => useMutation({ mutationFn: () => post<TotpSetup>('/auth/2fa/setup') })

function useTotpToggle(path: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => post<void>(path, { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: METHODS_KEY })
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
export const useEnableTotp = () => useTotpToggle('/auth/2fa/enable')
export const useDisableTotp = () => useTotpToggle('/auth/2fa/disable')

export const useSessions = () =>
  useQuery({ queryKey: SESSIONS_KEY, queryFn: () => get<LoginSession[]>('/auth/sessions') })

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del(`/auth/sessions/${id}`),
    onMutate: (id) => {
      qc.setQueryData<LoginSession[]>(SESSIONS_KEY, (list) => list?.filter((s) => s.id !== id))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  })
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post<void>('/auth/sessions/revoke-others'),
    onSuccess: () => qc.setQueryData<LoginSession[]>(SESSIONS_KEY, (list) => list?.filter((s) => s.current)),
    onSettled: () => qc.invalidateQueries({ queryKey: SESSIONS_KEY }),
  })
}

export const useCalendarToken = () =>
  useQuery({ queryKey: ['users', 'me', 'calendar'], queryFn: () => get<{ token: string }>('/users/me/calendar') })

export function useRegenerateCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post<{ token: string }>('/users/me/calendar'),
    onSuccess: (d) => qc.setQueryData(['users', 'me', 'calendar'], d),
  })
}

export const calendarUrl = (token: string) => `${window.location.origin}/api/calendar/${token}.ics`
