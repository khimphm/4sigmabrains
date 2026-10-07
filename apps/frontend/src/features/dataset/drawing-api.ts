import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '@/lib/api'
import type { DeadlineTone } from '@/lib/deadline'
import type { User } from '@/types/api'

// Kiểu dữ liệu theo apps/backend/src/modules/dataset (entities + service.getDrawing)
export type DrawingStatus = 'UNLABELED' | 'LABELING' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED'
export type AnnotationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface DatasetLabel {
  id: string
  name: string
  description: string | null
  color: string
  position: number
  active: boolean
}

export interface DrawingAnnotation {
  id: string
  createdAt: string
  updatedAt: string
  drawingId: string
  labelTypeId: string
  labelType: DatasetLabel
  page: number
  x: number
  y: number
  width: number
  height: number
  note: string | null
  status: AnnotationStatus
  authorId: string
  author: User
  reviewedById: string | null
  reviewedBy: User | null
  reviewNote: string | null
}

export interface DrawingDetail {
  id: string
  createdAt: string
  updatedAt: string
  batchId: string
  batch: { id: string; name: string; description: string | null; projectId: string | null }
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
  annotations: DrawingAnnotation[]
  prevId: string | null
  nextId: string | null
}

export interface BatchDrawingRow {
  id: string
  code: string
  title: string | null
  status: DrawingStatus
  pageCount: number
  annotationCount: number
}

export type AnnotationGeometry = Pick<DrawingAnnotation, 'x' | 'y' | 'width' | 'height'>
export type AnnotationPatch = Partial<AnnotationGeometry & { labelTypeId: string; note: string | null }>
export interface AnnotationInput extends AnnotationGeometry {
  labelTypeId: string
  page: number
  note?: string
}
export interface ReviewInput {
  decision: 'APPROVE' | 'REQUEST_CHANGES'
  note?: string
  annotations?: { id: string; status: AnnotationStatus; reviewNote?: string }[]
}

export const DRAWING_STATUS_META: Record<DrawingStatus, { label: string; tone: DeadlineTone | 'primary' }> = {
  UNLABELED: { label: 'Chưa gán', tone: 'neutral' },
  LABELING: { label: 'Đang gán', tone: 'primary' },
  IN_REVIEW: { label: 'Chờ duyệt', tone: 'due-soon' },
  CHANGES_REQUESTED: { label: 'Cần sửa', tone: 'late' },
  APPROVED: { label: 'Đã duyệt', tone: 'on-time' },
}

export const ANNOTATION_STATUS_META: Record<AnnotationStatus, { label: string; tone: DeadlineTone }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'due-soon' },
  APPROVED: { label: 'Đạt', tone: 'on-time' },
  REJECTED: { label: 'Không đạt', tone: 'overdue' },
}

export const EDITABLE_STATUSES: DrawingStatus[] = ['UNLABELED', 'LABELING', 'CHANGES_REQUESTED']

export const drawingFileUrl = (id: string) => `/api/dataset/drawings/${id}/file`

const drawingKey = (id: string) => ['dataset', 'drawing', id] as const

export const useDrawing = (id: string | undefined) =>
  useQuery({
    queryKey: drawingKey(id ?? ''),
    queryFn: () => get<DrawingDetail>(`/dataset/drawings/${id}`),
    enabled: !!id,
  })

export const useDrawingLabels = () =>
  useQuery({
    queryKey: ['dataset', 'labels'],
    queryFn: () => get<DatasetLabel[]>('/dataset/labels'),
    staleTime: 60_000,
    select: (rows) => rows.filter((l) => l.active).sort((a, b) => a.position - b.position),
  })

export const useBatchDrawingList = (batchId: string | undefined) =>
  useQuery({
    queryKey: ['dataset', 'batch-drawings', batchId],
    queryFn: () => get<BatchDrawingRow[]>(`/dataset/batches/${batchId}/drawings`),
    enabled: !!batchId,
    staleTime: 30_000,
  })

function useDrawingCache(drawingId: string) {
  const qc = useQueryClient()
  const key = drawingKey(drawingId)
  return {
    qc,
    key,
    async snapshot() {
      await qc.cancelQueries({ queryKey: key })
      return qc.getQueryData<DrawingDetail>(key)
    },
    setAnnotations(fn: (list: DrawingAnnotation[]) => DrawingAnnotation[]) {
      qc.setQueryData<DrawingDetail>(key, (d) => (d ? { ...d, annotations: fn(d.annotations) } : d))
    },
    restore(prev: DrawingDetail | undefined) {
      if (prev) qc.setQueryData(key, prev)
    },
    invalidate() {
      // Danh sách đợt / thống kê (W6) cũng dùng prefix ['dataset']
      return qc.invalidateQueries({ queryKey: ['dataset'] })
    },
  }
}

export function useCreateAnnotation(drawingId: string) {
  const cache = useDrawingCache(drawingId)
  return useMutation({
    mutationFn: (input: AnnotationInput) => post<DrawingAnnotation>(`/dataset/drawings/${drawingId}/annotations`, input),
    onSuccess: (a) => cache.setAnnotations((list) => [...list, a]),
    onSettled: () => cache.invalidate(),
  })
}

export function useUpdateAnnotation(drawingId: string) {
  const cache = useDrawingCache(drawingId)
  return useMutation({
    mutationFn: ({ id, ...data }: AnnotationPatch & { id: string }) => patch<DrawingAnnotation>(`/dataset/annotations/${id}`, data),
    onMutate: async ({ id, ...data }) => {
      const prev = await cache.snapshot()
      cache.setAnnotations((list) => list.map((a) => (a.id === id ? { ...a, ...data } : a)))
      return { prev }
    },
    onError: (_e, _v, ctx) => cache.restore(ctx?.prev),
    onSuccess: (a) => cache.setAnnotations((list) => list.map((x) => (x.id === a.id ? a : x))),
    onSettled: () => cache.invalidate(),
  })
}

export function useDeleteAnnotation(drawingId: string) {
  const cache = useDrawingCache(drawingId)
  return useMutation({
    mutationFn: (id: string) => del(`/dataset/annotations/${id}`),
    onMutate: async (id) => {
      const prev = await cache.snapshot()
      cache.setAnnotations((list) => list.filter((a) => a.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx) => cache.restore(ctx?.prev),
    onSettled: () => cache.invalidate(),
  })
}

export function useSubmitDrawing(drawingId: string) {
  const cache = useDrawingCache(drawingId)
  return useMutation({
    mutationFn: (reviewerId: string | null) =>
      post<DrawingDetail>(`/dataset/drawings/${drawingId}/submit`, reviewerId ? { reviewerId } : {}),
    onSuccess: (d) => cache.qc.setQueryData(cache.key, d),
    onSettled: () => cache.invalidate(),
  })
}

export function useReviewDrawing(drawingId: string) {
  const cache = useDrawingCache(drawingId)
  return useMutation({
    mutationFn: (input: ReviewInput) => post<DrawingDetail>(`/dataset/drawings/${drawingId}/review`, input),
    onSuccess: (d) => cache.qc.setQueryData(cache.key, d),
    onSettled: () => cache.invalidate(),
  })
}

// Backend không tự đếm số trang PDF lúc tải lên; trang này cập nhật lại khi đọc được file.
export function useSyncPageCount(drawingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pageCount: number) => patch<DrawingDetail>(`/dataset/drawings/${drawingId}`, { pageCount }),
    onSuccess: (d) => {
      qc.setQueryData<DrawingDetail>(drawingKey(drawingId), (old) => (old ? { ...old, pageCount: d.pageCount } : old))
      qc.invalidateQueries({ queryKey: ['dataset', 'batch-drawings'] })
    },
  })
}
