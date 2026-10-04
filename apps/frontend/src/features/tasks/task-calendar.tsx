import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/api'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function TaskCalendar({ tasks, onOpen, onAddOn }: {
  tasks: Task[]
  onOpen: (t: Task) => void
  onAddOn?: (day: Date) => void
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  )
  const withDue = tasks.filter((t) => t.dueDate)

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h3 className="font-semibold capitalize">{format(month, 'LLLL yyyy', { locale: vi })}</h3>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Hôm nay
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Tháng trước">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Tháng sau">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = withDue.filter((t) => isSameDay(new Date(t.dueDate!), day))
          return (
            <div
              key={day.toISOString()}
              onDoubleClick={() => onAddOn?.(day)}
              className={cn('min-h-28 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0', !isSameMonth(day, month) && 'bg-muted/30')}
            >
              <div
                className={cn(
                  'mb-1 grid size-6 place-items-center rounded-full text-xs',
                  isToday(day) ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground',
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpen(t)}
                    className={cn(
                      'hover:bg-muted flex w-full items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-[11px]',
                      t.status === 'DONE' && 'text-muted-foreground line-through',
                    )}
                  >
                    <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_META[t.status].dot)} />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {items.length > 3 && <div className="text-muted-foreground px-1.5 text-[11px]">+{items.length - 3} việc</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
