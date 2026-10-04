import { useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError } from '@/lib/api'

export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED'
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER'

export interface CurrentUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
}

export function useAuth() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api<CurrentUser>('/auth/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 60_000,
    retry: false,
  })

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    queryClient.setQueryData(['auth', 'me'], null)
  }

  return { user: query.data ?? null, isLoading: query.isLoading, logout }
}
