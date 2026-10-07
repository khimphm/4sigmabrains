import type { DeadlineTone } from '@/lib/deadline'
import type { TaskPriority, TaskStatus } from '@/types/api'

// Tông màu Pill cho trạng thái / ưu tiên (luôn kèm chữ)
export const STATUS_TONE: Record<TaskStatus, DeadlineTone | 'primary'> = {
  TODO: 'neutral',
  IN_PROGRESS: 'primary',
  REVIEW: 'due-soon',
  DONE: 'on-time',
}

export const PRIORITY_TONE: Record<TaskPriority, DeadlineTone | 'primary'> = {
  URGENT: 'overdue',
  HIGH: 'overdue',
  MEDIUM: 'primary',
  LOW: 'neutral',
}

export const PRIORITY_PILL: Record<TaskPriority, string> = {
  URGENT: 'Khẩn cấp',
  HIGH: 'Ưu tiên cao',
  MEDIUM: 'Ưu tiên vừa',
  LOW: 'Ưu tiên thấp',
}

export const FIELD_LABEL: Record<string, string> = {
  title: 'tiêu đề',
  description: 'mô tả',
  acceptanceCriteria: 'tiêu chí hoàn thành',
  status: 'trạng thái',
  priority: 'mức ưu tiên',
  assigneeId: 'người phụ trách',
  startDate: 'ngày bắt đầu',
  dueDate: 'hạn hoàn thành',
  labels: 'nhãn',
}

export const taskCode = (t: { project?: { key: string } | null; number: number }) => `${t.project?.key ?? ''}-${t.number}`
