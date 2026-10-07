import { differenceInCalendarDays, differenceInHours, differenceInMinutes, format, isToday, isTomorrow } from 'date-fns'

export type DeadlineTone = 'overdue' | 'due-soon' | 'on-time' | 'late' | 'neutral'

export interface DeadlineState {
  tone: DeadlineTone
  label: string
}

const span = (from: Date, to: Date) => {
  const days = Math.abs(differenceInCalendarDays(to, from))
  if (days >= 1) return `${days} ngày`
  const hours = Math.abs(differenceInHours(to, from))
  if (hours >= 1) return `${hours} giờ`
  return `${Math.max(1, Math.abs(differenceInMinutes(to, from)))} phút`
}

// Quy tắc Figma: trạng thái hạn chót luôn có chữ, không chỉ dựa vào màu.
export function deadlineState(
  due: string | null | undefined,
  opts: { done?: boolean; completedAt?: string | null; now?: Date } = {},
): DeadlineState {
  const now = opts.now ?? new Date()
  if (!due) return { tone: 'neutral', label: 'Chưa có hạn' }
  const d = new Date(due)
  if (opts.done) {
    const at = opts.completedAt ? new Date(opts.completedAt) : now
    return at <= d ? { tone: 'on-time', label: 'Đúng hạn' } : { tone: 'late', label: `Trễ ${span(d, at)}` }
  }
  if (d < now) return { tone: 'overdue', label: `Quá hạn ${span(d, now)}` }
  const hoursLeft = differenceInHours(d, now)
  if (isToday(d)) return { tone: 'due-soon', label: hoursLeft < 3 ? `Còn ${span(now, d)}` : `Hôm nay ${format(d, 'HH:mm')}` }
  if (isTomorrow(d)) return { tone: 'due-soon', label: `Ngày mai ${format(d, 'HH:mm')}` }
  if (hoursLeft < 72) return { tone: 'due-soon', label: `Còn ${span(now, d)}` }
  return { tone: 'neutral', label: `Hạn ${format(d, 'dd/MM')}` }
}

export const TONE_CLASS: Record<DeadlineTone, string> = {
  overdue: 'bg-overdue text-overdue-foreground',
  'due-soon': 'bg-due-soon text-due-soon-foreground',
  'on-time': 'bg-on-time text-on-time-foreground',
  late: 'bg-late text-late-foreground',
  neutral: 'bg-neutral text-neutral-foreground',
}

export const DEADLINE_LEGEND: { tone: DeadlineTone; label: string }[] = [
  { tone: 'overdue', label: 'Quá hạn' },
  { tone: 'due-soon', label: 'Sắp đến hạn' },
  { tone: 'on-time', label: 'Đúng hạn' },
  { tone: 'late', label: 'Trễ hạn' },
]
