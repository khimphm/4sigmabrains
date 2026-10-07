import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, get, post } from '@/lib/api'
import type { User } from '@/types/api'

export type AuthProviders = {
  google: boolean
  microsoft: boolean
  github: boolean
  password: boolean
  emailEnabled: boolean
  allowedDomains: string[]
}

export type UserStatus = User['status']
export type LoginResult = { totpRequired: true } | { totpRequired: false; status: UserStatus }

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function useAuthProviders() {
  return useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: () => get<AuthProviders>('/auth/providers'),
    staleTime: 5 * 60_000,
  })
}

// Sau khi có phiên mới: nạp lại thông tin người dùng rồi trả về để điều hướng
function useRefreshMe() {
  const qc = useQueryClient()
  return async () => {
    const me = await api<User>('/auth/me').catch(() => null)
    qc.setQueryData(['auth', 'me'], me)
    return me
  }
}

export function useLogin() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: async (body: { email: string; password: string; remember: boolean }) => {
      const res = await post<LoginResult>('/auth/login', body)
      return { res, me: res.totpRequired ? null : await refreshMe() }
    },
  })
}

export function useVerify2fa() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: async (code: string) => {
      await post<{ status: UserStatus }>('/auth/2fa/verify', { code })
      return refreshMe()
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string; note?: string }) =>
      post<{ status: UserStatus }>('/auth/register', body),
  })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => post<void>('/auth/forgot-password', { email }) })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: { token: string; password: string }) => post<void>('/auth/reset-password', body),
  })
}

// Đích đến sau khi đăng nhập theo vai trò / trạng thái
export function homeFor(user: Pick<User, 'role' | 'status'> | null, next?: string | null) {
  if (!user) return '/login'
  if (user.status !== 'ACTIVE') return '/pending'
  if (user.role === 'CLIENT') return '/portal'
  return safeNext(next) ?? '/'
}

export function safeNext(next?: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return null
  return next
}
