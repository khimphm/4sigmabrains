import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, del, get, patch, post } from '@/lib/api'
import type { Decision, DecisionDetail, DecisionStatus, OpinionKind } from '@/types/api'

export interface DecisionFilters {
  status?: DecisionStatus
  projectId?: string
}

const qs = (f: DecisionFilters) => {
  const p = new URLSearchParams()
  if (f.status) p.set('status', f.status)
  if (f.projectId) p.set('projectId', f.projectId)
  const s = p.toString()
  return s ? `?${s}` : ''
}

// Danh sách chủ đề (kèm opinionCount / participantCount)
export const useDecisions = (filters: DecisionFilters = {}) =>
  useQuery({ queryKey: ['decisions', 'list', filters], queryFn: () => get<Decision[]>(`/decisions${qs(filters)}`) })

export const useDecision = (id?: string) =>
  useQuery({
    queryKey: ['decisions', 'detail', id],
    queryFn: () => get<DecisionDetail>(`/decisions/${id}`),
    enabled: !!id,
  })

export interface DecisionInput {
  title: string
  context: string
  projectId?: string | null
  dueDate?: string | null
}

export function useCreateDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DecisionInput) => post<DecisionDetail>('/decisions', data),
    onSuccess: (d) => {
      qc.setQueryData(['decisions', 'detail', d.id], d)
      qc.invalidateQueries({ queryKey: ['decisions', 'list'] })
    },
  })
}

export interface OpinionInput {
  body: string
  kind?: OpinionKind
  parentId?: string
  mentionIds?: string[]
}

// Hầu hết thao tác trả về chi tiết chủ đề đã cập nhật -> ghi thẳng vào cache
export function useDecisionActions(id: string) {
  const qc = useQueryClient()
  const key = ['decisions', 'detail', id]
  const onSuccess = (d: DecisionDetail) => {
    qc.setQueryData(key, d)
    qc.invalidateQueries({ queryKey: ['decisions', 'list'] })
  }
  return {
    update: useMutation({
      mutationFn: (data: Partial<Pick<DecisionInput, 'title' | 'context' | 'dueDate'>>) =>
        patch<DecisionDetail>(`/decisions/${id}`, data),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: () => del(`/decisions/${id}`),
      onSuccess: () => {
        qc.removeQueries({ queryKey: key })
        qc.invalidateQueries({ queryKey: ['decisions', 'list'] })
      },
    }),
    addOpinion: useMutation({
      mutationFn: (data: OpinionInput) => post<DecisionDetail>(`/decisions/${id}/opinions`, data),
      onSuccess,
    }),
    removeOpinion: useMutation({
      mutationFn: (opinionId: string) => api<DecisionDetail>(`/decisions/${id}/opinions/${opinionId}`, { method: 'DELETE' }),
      onSuccess,
    }),
    agree: useMutation({
      mutationFn: (opinionId: string) => post<DecisionDetail>(`/decisions/${id}/opinions/${opinionId}/agree`),
      onSuccess,
    }),
    decide: useMutation({
      mutationFn: (conclusion: string) => post<DecisionDetail>(`/decisions/${id}/decide`, { conclusion }),
      onSuccess,
    }),
    reopen: useMutation({ mutationFn: () => post<DecisionDetail>(`/decisions/${id}/reopen`), onSuccess }),
    cancel: useMutation({ mutationFn: () => post<DecisionDetail>(`/decisions/${id}/cancel`), onSuccess }),
  }
}
