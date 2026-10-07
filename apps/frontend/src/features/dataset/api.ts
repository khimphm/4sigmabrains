import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, del, get, patch, post } from '@/lib/api'
import type { DeadlineTone } from '@/lib/deadline'
import type { User } from '@/types/api'

// Hooks dữ liệu cho trang tổng quan Dataset bản vẽ (W6).
// Chi tiết bản vẽ / khoanh vùng nằm ở drawing-api.ts (W7). Mọi query key đều bắt đầu bằng ['dataset'].

export type DrawingStatus = 'UNLABELED' | 'LABELING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED'

export const DRAWING_STATUSES: DrawingStatus[] = ['UNLABELED', 'LABELING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED']

export const DRAWING_STATUS: Record<DrawingStatus, { label: string; tone: DeadlineTone | 'primary'; bar: string }> = {
  UNLABELED: { label: 'Chưa gán nhãn', tone: 'neutral', bar: 'bg-neutral-foreground/40' },
  LABELING: { label: 'Đang gán nhãn', tone: 'primary', bar: 'bg-primary' },
  IN_REVIEW: { label: 'Chờ duyệt', tone: 'due-soon', bar: 'bg-due-soon-foreground' },
  CHANGES_REQUESTED: { label: 'Cần sửa', tone: 'late', bar: 'bg-late-foreground' },
  APPROVED: { label: 'Đã duyệt', tone: 'on-time', bar: 'bg-on-time-foreground' },
}

export interface DatasetStats {
  total: number
  approved: number
  inReview: number
  labeling: number
  changesRequested: number
  unlabeled: number
  byLabel: { id: string; name: string; color: string; count: number }[]
}

export interface LabelType {
  id: string
  name: string
  description: string | null
  color: string
  position: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface DrawingBatch {
  id: string
  name: string
  description: string | null
  projectId: string | null
  project: { id: string; name: string; key: string; color: string } | null
  createdById: string
  createdBy: User
  createdAt: string
  updatedAt: string
  total: number
  approved: number
  inReview: number
}

export interface DrawingRow {
  id: string
  batchId: string
  code: string
  title: string | null
  fileName: string
  mimeType: string
  size: number
  pageCount: number
  status: DrawingStatus
  labelerId: string | null
  labeler: User | null
  reviewerId: string | null
  reviewer: User | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  annotationCount: number
}

export const datasetFileUrl = (drawingId: string) => `/api/dataset/drawings/${drawingId}/file`

export function exportUrl(opts: { format: 'jsonl' | 'coco'; all?: boolean; batchId?: string }) {
  const p = new URLSearchParams({ format: opts.format })
  if (opts.all) p.set('all', 'true')
  if (opts.batchId) p.set('batchId', opts.batchId)
  return `/api/dataset/export?${p}`
}

// ---------- Truy vấn ----------
export const useDatasetStats = (batchId?: string) =>
  useQuery({
    queryKey: ['dataset', 'stats', batchId ?? 'all'],
    queryFn: () => get<DatasetStats>(`/dataset/stats${batchId ? `?batchId=${batchId}` : ''}`),
  })

// Trả về cả nhãn đã lưu trữ (active=false); lọc ở nơi dùng
export const useLabelTypes = () =>
  useQuery({ queryKey: ['dataset', 'labels'], queryFn: () => get<LabelType[]>('/dataset/labels'), staleTime: 60_000 })

export const useBatches = () =>
  useQuery({ queryKey: ['dataset', 'batches'], queryFn: () => get<DrawingBatch[]>('/dataset/batches') })

// Cùng key với useBatchDrawingList của drawing-api.ts để dùng chung cache
export const useBatchDrawings = (batchId: string | undefined) =>
  useQuery({
    queryKey: ['dataset', 'batch-drawings', batchId],
    queryFn: () => get<DrawingRow[]>(`/dataset/batches/${batchId}/drawings`),
    enabled: !!batchId,
  })

// ---------- Thay đổi ----------
function useInvalidateDataset() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['dataset'] })
}

export interface LabelInput {
  name: string
  description?: string | null
  color?: string
  active?: boolean
  position?: number
}

export function useSaveLabel() {
  const invalidate = useInvalidateDataset()
  return useMutation({
    mutationFn: ({ id, ...body }: LabelInput & { id?: string }) =>
      id ? patch<LabelType>(`/dataset/labels/${id}`, body) : post<LabelType>('/dataset/labels', body),
    onSuccess: invalidate,
  })
}

// Nhãn đã được dùng thì backend chỉ lưu trữ (archived: true)
export function useRemoveLabel() {
  const invalidate = useInvalidateDataset()
  return useMutation({
    mutationFn: (id: string) => api<{ archived: boolean }>(`/dataset/labels/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export interface BatchInput {
  name: string
  description?: string | null
  projectId?: string | null
}

export function useSaveBatch() {
  const invalidate = useInvalidateDataset()
  return useMutation({
    mutationFn: ({ id, ...body }: BatchInput & { id?: string }) =>
      id ? patch<DrawingBatch>(`/dataset/batches/${id}`, body) : post<DrawingBatch>('/dataset/batches', body),
    onSuccess: invalidate,
  })
}

export function useRemoveBatch() {
  const invalidate = useInvalidateDataset()
  return useMutation({ mutationFn: (id: string) => del(`/dataset/batches/${id}`), onSuccess: invalidate })
}

export function useUploadDrawings() {
  const invalidate = useInvalidateDataset()
  return useMutation({
    mutationFn: ({ batchId, files }: { batchId: string; files: File[] }) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      return post<DrawingRow[]>(`/dataset/batches/${batchId}/drawings`, form)
    },
    onSuccess: invalidate,
  })
}

export function useUpdateDrawingRow() {
  const invalidate = useInvalidateDataset()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; labelerId?: string | null; reviewerId?: string | null; title?: string | null }) =>
      patch(`/dataset/drawings/${id}`, body),
    onSuccess: invalidate,
  })
}

export function useRemoveDrawing() {
  const invalidate = useInvalidateDataset()
  return useMutation({ mutationFn: (id: string) => del(`/dataset/drawings/${id}`), onSuccess: invalidate })
}
