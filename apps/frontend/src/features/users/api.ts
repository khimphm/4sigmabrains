import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { get, patch } from '@/lib/api'
import type { User } from '@/types/api'

export const useUsers = (all = false) =>
  useQuery({ queryKey: ['users', { all }], queryFn: () => get<User[]>(`/users${all ? '?all=true' : ''}`), staleTime: 60_000 })

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

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; role?: User['role']; status?: User['status'] }) =>
      patch<User>(`/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
