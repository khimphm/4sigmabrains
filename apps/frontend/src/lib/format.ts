import { differenceInCalendarDays, format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from 'date-fns'
import { vi } from 'date-fns/locale'

export const fmtDate = (d: string | Date | null | undefined, pattern = 'dd/MM/yyyy') =>
  d ? format(new Date(d), pattern, { locale: vi }) : ''

export const fmtDateTime = (d: string | Date | null | undefined) => fmtDate(d, 'HH:mm, dd/MM/yyyy')

export const fromNow = (d: string | Date) => formatDistanceToNowStrict(new Date(d), { locale: vi, addSuffix: true })

// "Hôm nay", "Ngày mai", "Quá hạn 3 ngày"...
export function dueLabel(due: string | null, done = false) {
  if (!due) return null
  const d = new Date(due)
  if (done) return fmtDate(d, 'dd/MM')
  if (isPast(d) && !isToday(d)) return `Quá hạn ${Math.abs(differenceInCalendarDays(d, new Date()))} ngày`
  if (isToday(d)) return isPast(d) ? 'Quá hạn hôm nay' : `Hôm nay ${fmtDate(d, 'HH:mm')}`
  if (isTomorrow(d)) return 'Ngày mai'
  return fmtDate(d, 'dd/MM')
}

export const isOverdue = (due: string | null, done = false) => !!due && !done && isPast(new Date(due))

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

// datetime-local <-> ISO
export const toLocalInput = (iso: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '')
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)
