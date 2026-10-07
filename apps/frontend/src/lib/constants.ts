import type { DecisionStatus, ProjectStatus, TaskPriority, TaskStatus, UserRole, UserStatus } from '@/types/api'

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; badge: string }> = {
  TODO: { label: 'Cần làm', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  IN_PROGRESS: { label: 'Đang làm', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  REVIEW: { label: 'Chờ duyệt', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  DONE: { label: 'Hoàn thành', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
}

export const PRIORITIES: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW']

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bars: number }> = {
  URGENT: { label: 'Khẩn cấp', color: 'text-red-600 dark:text-red-400', bars: 4 },
  HIGH: { label: 'Cao', color: 'text-orange-500', bars: 3 },
  MEDIUM: { label: 'Trung bình', color: 'text-blue-500', bars: 2 },
  LOW: { label: 'Thấp', color: 'text-slate-400', bars: 1 },
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; badge: string }> = {
  ACTIVE: { label: 'Đang chạy', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  ON_HOLD: { label: 'Tạm dừng', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  COMPLETED: { label: 'Hoàn thành', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  ARCHIVED: { label: 'Lưu trữ', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

export const DECISION_STATUS_META: Record<DecisionStatus, { label: string; badge: string }> = {
  OPEN: { label: 'Đang lấy ý kiến', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  DECIDED: { label: 'Đã chốt', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  CANCELLED: { label: 'Đã huỷ', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý dự án',
  MEMBER: 'Thành viên',
  CLIENT: 'Khách hàng',
}
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Đang hoạt động',
  DISABLED: 'Đã khoá',
}

export const PROJECT_COLORS = ['#1F4FD1', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2', '#CA8A04', '#475569']
