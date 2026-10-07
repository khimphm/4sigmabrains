import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { Attachment, AttachmentTarget } from '@/types/api'

// Một dòng của thư viện "Tệp và bản vẽ" (GET /files): bản mới nhất của mỗi chuỗi phiên bản
export interface LibraryFile {
  id: string
  fileName: string
  mimeType: string
  size: number
  version: number
  sharedWithClient: boolean
  createdAt: string
  targetType: AttachmentTarget
  targetId: string
  uploader: { id: string; name: string; avatarUrl: string | null }
  project: { id: string; name: string; key: string; color: string } | null
  target: { id: string; label: string; title: string } | null
}

export interface FileFilters {
  projectId?: string
  q?: string
  shared?: boolean
  uploaderId?: string
}

const qs = (f: FileFilters) => {
  const p = new URLSearchParams()
  if (f.projectId) p.set('projectId', f.projectId)
  if (f.q?.trim()) p.set('q', f.q.trim())
  if (f.shared) p.set('shared', 'true')
  if (f.uploaderId) p.set('uploaderId', f.uploaderId)
  const s = p.toString()
  return s ? `?${s}` : ''
}

// Loại file được lọc phía client (để đếm số lượng cho từng chip), cùng quy tắc với backend
export const useFileLibrary = (filters: FileFilters = {}) =>
  useQuery({
    queryKey: ['files', filters],
    queryFn: () => get<LibraryFile[]>(`/files${qs(filters)}`),
    placeholderData: (prev) => prev,
  })

export const useFileVersions = (id: string | null) =>
  useQuery({
    queryKey: ['files', 'versions', id],
    queryFn: () => get<Attachment[]>(`/attachments/${id}/versions`),
    enabled: !!id,
  })

function useInvalidateFiles() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['files'] })
    qc.invalidateQueries({ queryKey: ['attachments'] })
  }
}

export function useUploadFile() {
  const invalidate = useInvalidateFiles()
  return useMutation({
    mutationFn: ({ target, targetId, file, shared }: {
      target: AttachmentTarget
      targetId: string
      file: File
      shared?: boolean
    }) => {
      const form = new FormData()
      form.append('file', file)
      if (shared) form.append('shared', 'true')
      return post<Attachment>(`/attachments/${target}/${targetId}`, form)
    },
    onSuccess: invalidate,
  })
}

export function useUploadVersion() {
  const invalidate = useInvalidateFiles()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return post<Attachment>(`/attachments/${id}/versions`, form)
    },
    onSuccess: invalidate,
  })
}

export function useShareFile() {
  const qc = useQueryClient()
  const invalidate = useInvalidateFiles()
  return useMutation({
    mutationFn: ({ id, shared }: { id: string; shared: boolean }) =>
      patch<Attachment>(`/attachments/${id}`, { sharedWithClient: shared }),
    // Cập nhật lạc quan để công tắc phản hồi ngay
    onMutate: async ({ id, shared }) => {
      await qc.cancelQueries({ queryKey: ['files'] })
      const snapshot = qc.getQueriesData<LibraryFile[]>({ queryKey: ['files'] })
      qc.setQueriesData<LibraryFile[]>({ queryKey: ['files'] }, (old) =>
        Array.isArray(old) ? old.map((f) => (f.id === id ? { ...f, sharedWithClient: shared } : f)) : old,
      )
      return { snapshot }
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: invalidate,
  })
}

export function useDeleteFile() {
  const invalidate = useInvalidateFiles()
  return useMutation({ mutationFn: (id: string) => del(`/attachments/${id}`), onSuccess: invalidate })
}

export const fileUrl = (id: string, download = false) => `/api/attachments/${id}${download ? '?download=1' : ''}`
