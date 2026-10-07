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
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DeadlineBadge } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { deadlineState, TONE_CLASS } from '@/lib/deadline'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/api'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const DOT: Record<string, string> = {
  overdue: 'bg-overdue-foreground',
  'due-soon': 'bg-due-soon-foreground',
  'on-time': 'bg-on-time-foreground',
  late: 'bg-late-foreground',
  neutral: 'bg-neutral-foreground',
}

const toneOf = (t: Task) => deadlineState(t.dueDate, { done: t.status === 'DONE', completedAt: t.completedAt }).tone

export function TaskCalendar({ tasks, onOpen, onAddOn }: {
  tasks: Task[]
  onOpen: (t: Task) => void
  onAddOn?: (day: Date) => void
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Date>(() => new Date())
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  )
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.dueDate) continue
      const k = format(new Date(t.dueDate), 'yyyy-MM-dd')
      m.set(k, [...(m.get(k) ?? []), t])
    }
    for (const list of m.values()) list.sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))
    return m
  }, [tasks])
  const inMonth = tasks.filter((t) => t.dueDate && isSameMonth(new Date(t.dueDate), month)).length
  const noDue = tasks.filter((t) => !t.dueDate).length
  const selectedItems = byDay.get(format(selected, 'yyyy-MM-dd')) ?? []

  const goto = (m: Date) => setMonth(startOfMonth(m))

  return (
    <div className="space-y-4">
      <div className="bg-card shadow-card overflow-hidden rounded-[10px] border">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <h3 className="text-[17px] font-bold capitalize">{format(month, 'LLLL, yyyy', { locale: vi })}</h3>
          <span className="text-muted-foreground text-[13px]">
            {inMonth} việc có hạn trong tháng{noDue ? ` · ${noDue} việc chưa có hạn` : ''}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goto(new Date())
                setSelected(new Date())
              }}
            >
              Hôm nay
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => goto(addMonths(month, -1))} aria-label="Tháng trước">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => goto(addMonths(month, 1))} aria-label="Tháng sau">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground bg-subtle grid grid-cols-7 border-b text-center text-xs font-semibold">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const items = byDay.get(format(day, 'yyyy-MM-dd')) ?? []
            const isSel = isSameDay(day, selected)
            const muted = !isSameMonth(day, month)
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                onDoubleClick={() => onAddOn?.(day)}
                className={cn(
                  'group/day relative min-h-16 cursor-pointer border-r border-b p-1 transition-colors md:min-h-28 md:p-1.5 [&:nth-child(7n)]:border-r-0',
                  muted && 'bg-subtle/60',
                  isSel ? 'bg-primary-soft/50' : 'hover:bg-subtle',
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(day)
                    }}
                    aria-label={`${format(day, 'EEEE, dd/MM/yyyy', { locale: vi })}: ${items.length} việc`}
                    aria-pressed={isSel}
                    className={cn(
                      'num grid size-6 place-items-center rounded-full text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      isToday(day)
                        ? 'bg-primary text-primary-foreground font-bold'
                        : muted
                          ? 'text-muted-foreground/60'
                          : 'text-text-secondary font-medium',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                  {onAddOn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddOn(day)
                      }}
                      className="text-muted-foreground hover:text-foreground hover:bg-card hidden size-6 place-items-center rounded opacity-0 transition-opacity group-hover/day:opacity-100 focus-visible:opacity-100 md:grid"
                      aria-label={`Tạo việc hạn ${format(day, 'dd/MM')}`}
                    >
                      <CalendarPlus className="size-3.5" strokeWidth={1.8} />
                    </button>
                  )}
                </div>
                {/* Di động: chỉ hiện chấm theo trạng thái hạn */}
                <div className="mt-1 flex flex-wrap gap-0.5 px-0.5 md:hidden">
                  {items.slice(0, 4).map((t) => (
                    <span key={t.id} className={cn('size-1.5 rounded-full', DOT[toneOf(t)])} />
                  ))}
                  {items.length > 4 && <span className="text-muted-foreground text-[9px] leading-none">+{items.length - 4}</span>}
                </div>
                <div className="mt-1 hidden space-y-1 md:block">
                  {items.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen(t)
                      }}
                      title={`${t.project.key}-${t.number} · ${t.title}`}
                      className={cn(
                        'flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-[filter] hover:brightness-95 dark:hover:brightness-125',
                        TONE_CLASS[toneOf(t)],
                        t.status === 'DONE' && 'line-through decoration-1 opacity-80',
                      )}
                    >
                      <span className="num shrink-0 opacity-70">{t.number}</span>
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                  {items.length > 3 && (
                    <span className="text-muted-foreground block px-1.5 text-[11px] font-medium">+{items.length - 3} việc</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-card shadow-card rounded-[10px] border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h4 className="text-[15px] font-bold capitalize">{format(selected, 'EEEE, dd/MM/yyyy', { locale: vi })}</h4>
          <span className="text-muted-foreground text-[13px]">{selectedItems.length} việc</span>
          {onAddOn && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => onAddOn(selected)}>
              <CalendarPlus /> Tạo việc ngày này
            </Button>
          )}
        </div>
        {selectedItems.length ? (
          <ul>
            {selectedItems.map((t) => (
              <li key={t.id} className="border-b last:border-0">
                <button
                  type="button"
                  onClick={() => onOpen(t)}
                  className="hover:bg-subtle flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors"
                >
                  <span className="text-muted-foreground num w-16 shrink-0 text-xs font-medium">
                    {t.project.key}-{t.number}
                  </span>
                  <span className={cn('min-w-0 flex-1 truncate text-sm font-semibold', t.status === 'DONE' && 'text-text-secondary')}>
                    {t.title}
                  </span>
                  <DeadlineBadge due={t.dueDate} done={t.status === 'DONE'} completedAt={t.completedAt} className="hidden sm:inline-flex" />
                  {t.assignee && <UserAvatar user={t.assignee} className="size-6" />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">Không có việc nào đến hạn ngày này.</p>
        )}
      </div>
    </div>
  )
}
