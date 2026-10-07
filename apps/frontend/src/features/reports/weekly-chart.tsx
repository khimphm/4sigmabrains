import { addDays, format } from 'date-fns'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { ReportData } from './api'

// Làm tròn trục Y lên số "đẹp"
function niceMax(v: number) {
  if (v <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s * 4 >= v) ?? pow * 10
  return step * 4
}

export function ChartLegend({ items, className }: { items: { label: string; className: string }[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]', className)}>
      {items.map((i) => (
        <li key={i.label} className="text-text-secondary inline-flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2.5 rounded-[3px]', i.className)} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

// Cột chồng: đúng hạn (dưới) + trễ hạn (trên), 12 tuần. Vẽ bằng CSS, không dùng thư viện.
export function WeeklyChart({ weeks }: { weeks: ReportData['weekly'] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(0, ...weeks.map((w) => w.onTime + w.late)))
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i)
  const total = weeks.reduce((s, w) => s + w.done, 0)

  return (
    <figure className="min-w-0">
      <figcaption className="sr-only">
        Số việc hoàn thành mỗi tuần trong 12 tuần gần nhất, tổng {total} việc.
      </figcaption>
      <div className="flex gap-2">
        {/* Trục Y */}
        <div className="text-muted-foreground num relative h-52 w-7 shrink-0 text-right text-[11px]" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* Lưới */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52" aria-hidden>
            {ticks.map((t) => (
              <span
                key={t}
                className={cn('absolute inset-x-0 border-t', t === 0 ? 'border-border-strong' : 'border-border border-dashed')}
                style={{ bottom: `${(t / max) * 100}%` }}
              />
            ))}
          </div>
          <ol className="relative flex h-52 items-end gap-1 sm:gap-2">
            {weeks.map((w, i) => {
              const start = new Date(w.week)
              const range = `${format(start, 'dd/MM')} – ${format(addDays(start, 6), 'dd/MM')}`
              const sum = w.onTime + w.late
              const isActive = active === i
              return (
                <li
                  key={w.week}
                  className="group relative flex h-full min-w-0 flex-1 flex-col justify-end"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  tabIndex={0}
                  aria-label={`Tuần ${range}: ${w.done} việc hoàn thành, ${w.onTime} đúng hạn hoặc không hạn, ${w.late} trễ hạn`}
                >
                  {sum > 0 && (
                    <span className="text-text-secondary num mb-1 text-center text-[11px] font-semibold" aria-hidden>
                      {sum}
                    </span>
                  )}
                  <span
                    className={cn(
                      'mx-auto flex w-full max-w-9 flex-col overflow-hidden rounded-t-[4px] transition-opacity duration-150',
                      active !== null && !isActive && 'opacity-50',
                    )}
                    style={{ height: `${(sum / max) * 100}%` }}
                    aria-hidden
                  >
                    <span className="bg-late-foreground/90 w-full" style={{ height: sum ? `${(w.late / sum) * 100}%` : 0 }} />
                    <span className="bg-on-time-foreground/90 w-full flex-1" />
                  </span>
                  {isActive && (
                    <div
                      role="tooltip"
                      className={cn(
                        'bg-popover text-popover-foreground shadow-pop pointer-events-none absolute bottom-full z-10 mb-2 w-44 rounded-lg border p-2.5 text-[12px]',
                        i < 2 ? 'left-0' : i > weeks.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2',
                      )}
                    >
                      <div className="mb-1.5 font-semibold">Tuần {range}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="bg-on-time-foreground size-2 rounded-[2px]" /> Đúng hạn / không hạn
                        </span>
                        <span className="num font-semibold">{w.onTime}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="bg-late-foreground size-2 rounded-[2px]" /> Trễ hạn
                        </span>
                        <span className="num font-semibold">{w.late}</span>
                      </div>
                      <div className="text-muted-foreground mt-1 border-t pt-1">
                        Tổng hoàn thành: <span className="num text-foreground font-semibold">{w.done}</span>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          {/* Trục X */}
          <ol className="text-muted-foreground num mt-1.5 flex gap-1 text-[11px] sm:gap-2" aria-hidden>
            {weeks.map((w, i) => (
              <li key={w.week} className={cn('min-w-0 flex-1 truncate text-center', i % 2 === 1 && 'max-sm:invisible')}>
                {format(new Date(w.week), 'dd/MM')}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  )
}

// Thanh ngang nhỏ trong bảng
export function InlineBar({ value, max, className, label }: { value: number; max: number; className?: string; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="bg-subtle h-1.5 min-w-10 flex-1 overflow-hidden rounded-full" aria-hidden>
        <span className={cn('block h-full rounded-full', className ?? 'bg-primary')} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </span>
      <span className="num w-9 shrink-0 text-right font-semibold" aria-label={label}>
        {value}
      </span>
    </span>
  )
}
