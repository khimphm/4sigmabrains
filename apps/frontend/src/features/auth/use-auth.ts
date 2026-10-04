import { useQuery, useQueryClient } from '@tanstack/react-query'

import { api, ApiError, post } from '@/lib/api'
import type { User } from '@/types/api'

export function useAuth() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api<User>('/auth/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 60_000,
    retry: false,
  })

  const logout = async () => {
    await post('/auth/logout')
    queryClient.clear()
    queryClient.setQueryData(['auth', 'me'], null)
  }

  const user = query.data ?? null
  return {
    user,
    isLoading: query.isLoading,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    logout,
  }
}
