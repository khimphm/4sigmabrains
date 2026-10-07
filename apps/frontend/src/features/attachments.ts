import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { Attachment } from '@/types/api'

export type AttachmentTarget = 'TASK' | 'PROJECT' | 'DISCUSSION'

export const attachmentsKey = (target: AttachmentTarget, targetId: string) => ['attachments', target, targetId]

// Đường dẫn xem trực tiếp / tải về
export const attachmentUrl = (id: string, download = false) => `/api/attachments/${id}${download ? '?download=1' : ''}`

// Làm mới mọi danh sách có thể chứa file (đính kèm, thư viện tệp, số tệp trên thẻ công việc)
function useInvalidateFiles(target?: AttachmentTarget, targetId?: string) {
  const qc = useQueryClient()
  return () => {
    if (target && targetId) qc.invalidateQueries({ queryKey: attachmentsKey(target, targetId) })
    else qc.invalidateQueries({ queryKey: ['attachments'] })
    qc.invalidateQueries({ queryKey: ['files'] })
    qc.invalidateQueries({ queryKey: ['attachment-versions'] })
    if (target === 'TASK') {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', targetId] })
    }
  }
}

export const useAttachmentList = (target: AttachmentTarget, targetId: string) =>
  useQuery({ queryKey: attachmentsKey(target, targetId), queryFn: () => get<Attachment[]>(`/attachments/${target}/${targetId}`) })

export function useUploadAttachment(target: AttachmentTarget, targetId: string) {
  const invalidate = useInvalidateFiles(target, targetId)
  return useMutation({
    mutationFn: (input: File | { file: File; shared?: boolean }) => {
      const { file, shared } = input instanceof File ? { file: input, shared: false } : input
      const form = new FormData()
      form.append('file', file)
      if (shared) form.append('shared', 'true')
      return post<Attachment>(`/attachments/${target}/${targetId}`, form)
    },
    onSuccess: invalidate,
  })
}

// Tải phiên bản mới cho một file (v1 → v2…)
export function useUploadVersion(target?: AttachmentTarget, targetId?: string) {
  const invalidate = useInvalidateFiles(target, targetId)
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return post<Attachment>(`/attachments/${id}/versions`, form)
    },
    onSuccess: invalidate,
  })
}

export const useAttachmentVersions = (id: string | null, enabled = true) =>
  useQuery({
    queryKey: ['attachment-versions', id],
    queryFn: () => get<Attachment[]>(`/attachments/${id}/versions`),
    enabled: !!id && enabled,
  })

export function useShareAttachment(target?: AttachmentTarget, targetId?: string) {
  const qc = useQueryClient()
  const invalidate = useInvalidateFiles(target, targetId)
  return useMutation({
    mutationFn: ({ id, sharedWithClient }: { id: string; sharedWithClient: boolean }) =>
      patch<Attachment>(`/attachments/${id}`, { sharedWithClient }),
    onMutate: async ({ id, sharedWithClient }) => {
      if (!target || !targetId) return
      const key = attachmentsKey(target, targetId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Attachment[]>(key)
      qc.setQueryData<Attachment[]>(key, (old) => old?.map((a) => (a.id === id ? { ...a, sharedWithClient } : a)))
      return { prev, key }
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: invalidate,
  })
}

export function useDeleteAttachment(target?: AttachmentTarget, targetId?: string) {
  const invalidate = useInvalidateFiles(target, targetId)
  return useMutation({ mutationFn: (id: string) => del(`/attachments/${id}`), onSuccess: invalidate })
}

// Gói gọn cho chỗ cũ: { list, upload, remove } (+ version, share)
export function useAttachments(target: AttachmentTarget, targetId: string) {
  return {
    list: useAttachmentList(target, targetId),
    upload: useUploadAttachment(target, targetId),
    remove: useDeleteAttachment(target, targetId),
    version: useUploadVersion(target, targetId),
    share: useShareAttachment(target, targetId),
  }
}

// Phân loại file để hiện nhãn PDF / DWG / XLSX / IMG…
export type FileKind = 'pdf' | 'cad' | 'sheet' | 'doc' | 'image' | 'archive' | 'other'

export function fileKind(fileName: string, mimeType = ''): { kind: FileKind; tag: string } {
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : ''
  if (mimeType === 'application/pdf' || ext === 'pdf') return { kind: 'pdf', tag: 'PDF' }
  if (['dwg', 'dxf', 'rvt', 'ifc', 'skp'].includes(ext)) return { kind: 'cad', tag: ext.toUpperCase() }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return { kind: 'sheet', tag: ext.toUpperCase() }
  if (['doc', 'docx', 'odt', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) return { kind: 'doc', tag: ext.toUpperCase() }
  if (mimeType.startsWith('image/')) return { kind: 'image', tag: 'IMG' }
  if (['zip', 'rar', '7z'].includes(ext)) return { kind: 'archive', tag: ext.toUpperCase() }
  return { kind: 'other', tag: (ext || 'FILE').slice(0, 4).toUpperCase() }
}
