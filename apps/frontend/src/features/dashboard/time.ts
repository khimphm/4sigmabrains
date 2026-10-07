import { isToday, isYesterday } from 'date-fns'

import { fmtDate } from '@/lib/format'

// "Hôm nay, 08:30" · "Hôm qua, 15:42" · "28/09, 08:30" (năm khác thì kèm năm)
export function activityTime(d: string) {
  const date = new Date(d)
  if (isToday(date)) return `Hôm nay, ${fmtDate(date, 'HH:mm')}`
  if (isYesterday(date)) return `Hôm qua, ${fmtDate(date, 'HH:mm')}`
  if (date.getFullYear() === new Date().getFullYear()) return fmtDate(date, 'dd/MM, HH:mm')
  return fmtDate(date, 'dd/MM/yyyy, HH:mm')
}
