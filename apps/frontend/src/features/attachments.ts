import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, post } from '@/lib/api'
import type { Attachment } from '@/types/api'

export type AttachmentTarget = 'TASK' | 'PROJECT' | 'DISCUSSION'

export function useAttachments(target: AttachmentTarget, targetId: string) {
  const qc = useQueryClient()
  const key = ['attachments', target, targetId]
  const list = useQuery({ queryKey: key, queryFn: () => get<Attachment[]>(`/attachments/${target}/${targetId}`) })
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return post<Attachment>(`/attachments/${target}/${targetId}`, form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => del(`/attachments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  return { list, upload, remove }
}
