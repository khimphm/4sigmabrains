export type DueFilter = 'overdue' | 'today' | 'week' | 'none'
export interface ProjectTaskFilters {
  q: string
  assignee: string | null // userId | 'me' | 'none'
  due: DueFilter | null
  label: string | null
}

export const DUE_LABEL: Record<DueFilter, string> = {
  overdue: 'Quá hạn',
  today: 'Hôm nay',
  week: 'Tuần này',
  none: 'Chưa có hạn',
}
