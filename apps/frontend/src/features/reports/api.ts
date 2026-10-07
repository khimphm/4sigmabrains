import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'

// GET /reports?days=&projectId=
export interface ReportData {
  days: number
  summary: { done: number; onTime: number; late: number; overdue: number; open: number; created: number; rate: number | null }
  members: {
    id: string
    name: string
    title: string | null
    avatarUrl: string | null
    done: number
    onTime: number
    late: number
    overdue: number
    open: number
    avgLateHours: number
    rate: number | null
  }[]
  projects: {
    id: string
    name: string
    key: string
    color: string
    dueDate: string | null
    clientName: string | null
    total: number
    done: number
    overdue: number
    rate: number | null
    progress: number
  }[]
  /** 12 tuần gần nhất, `week` = thứ Hai đầu tuần (YYYY-MM-DD). onTime gồm cả việc không có hạn. */
  weekly: { week: string; done: number; onTime: number; late: number }[]
  labels: { label: string; total: number; overdue: number }[]
}

export const REPORT_RANGES = [
  { days: 7, label: '7 ngày' },
  { days: 30, label: '30 ngày' },
  { days: 90, label: '90 ngày' },
  { days: 365, label: '12 tháng' },
] as const

export function useReport(days: number, projectId?: string) {
  const params = new URLSearchParams({ days: String(days) })
  if (projectId) params.set('projectId', projectId)
  return useQuery({
    queryKey: ['reports', days, projectId ?? null],
    queryFn: () => get<ReportData>(`/reports?${params}`),
    placeholderData: keepPreviousData,
  })
}
