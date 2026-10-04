import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { Comment, Discussion } from '@/types/api'

export const useDiscussions = (projectId?: string) =>
  useQuery({
    queryKey: ['discussions', { projectId }],
    queryFn: () => get<Discussion[]>(`/discussions${projectId ? `?projectId=${projectId}` : ''}`),
  })

export const useDiscussion = (id: string) =>
  useQuery({ queryKey: ['discussions', id], queryFn: () => get<Discussion>(`/discussions/${id}`) })

export function useCreateDiscussion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; body: string; projectId?: string | null; mentionIds: string[] }) =>
      post<Discussion>('/discussions', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discussions'] }),
  })
}

export function useDiscussionActions(id: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['discussions'] })
  return {
    reply: useMutation({
      mutationFn: (data: { body: string; mentionIds: string[] }) => post<Comment>(`/discussions/${id}/replies`, data),
      onSuccess: invalidate,
    }),
    removeReply: useMutation({
      mutationFn: (replyId: string) => del(`/discussions/${id}/replies/${replyId}`),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: (data: Partial<Pick<Discussion, 'title' | 'body' | 'pinned'>>) =>
        patch<Discussion>(`/discussions/${id}`, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: () => del(`/discussions/${id}`), onSuccess: invalidate }),
  }
}
