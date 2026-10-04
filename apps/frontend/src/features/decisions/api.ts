import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { get, post } from '@/lib/api'
import type { Decision } from '@/types/api'

export const useDecisions = () => useQuery({ queryKey: ['decisions'], queryFn: () => get<Decision[]>('/decisions') })

export const useDecision = (id: string) =>
  useQuery({ queryKey: ['decisions', id], queryFn: () => get<Decision>(`/decisions/${id}`) })

export interface OptionInput {
  title: string
  description?: string
  pros: string[]
  cons: string[]
}

export function useCreateDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      title: string
      context: string
      projectId?: string | null
      dueDate?: string | null
      options: OptionInput[]
    }) => post<Decision>('/decisions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decisions'] }),
  })
}

export function useDecisionActions(id: string) {
  const qc = useQueryClient()
  const onSuccess = (d: Decision) => {
    qc.setQueryData(['decisions', id], d)
    qc.invalidateQueries({ queryKey: ['decisions'] })
  }
  return {
    vote: useMutation({
      mutationFn: (data: { optionId: string; comment?: string }) => post<Decision>(`/decisions/${id}/vote`, data),
      onSuccess,
    }),
    decide: useMutation({
      mutationFn: (data: { optionId: string; rationale: string }) => post<Decision>(`/decisions/${id}/decide`, data),
      onSuccess,
    }),
    addOption: useMutation({
      mutationFn: (data: OptionInput) => post<Decision>(`/decisions/${id}/options`, data),
      onSuccess,
    }),
    cancel: useMutation({ mutationFn: () => post<Decision>(`/decisions/${id}/cancel`), onSuccess }),
    reopen: useMutation({ mutationFn: () => post<Decision>(`/decisions/${id}/reopen`), onSuccess }),
  }
}
