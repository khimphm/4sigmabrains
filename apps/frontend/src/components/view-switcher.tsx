import { CalendarDays, KanbanSquare, List } from 'lucide-react'

import { cn } from '@/lib/utils'

export type TaskView = 'board' | 'list' | 'calendar'

const VIEWS = [
  { value: 'board', label: 'Bảng', icon: KanbanSquare },
  { value: 'list', label: 'Danh sách', icon: List },
  { value: 'calendar', label: 'Lịch', icon: CalendarDays },
] as const

export function ViewSwitcher({ value, onChange, views = ['board', 'list', 'calendar'] }: {
  value: TaskView
  onChange: (v: TaskView) => void
  views?: TaskView[]
}) {
  return (
    <div role="tablist" aria-label="Kiểu hiển thị" className="bg-subtle inline-flex rounded-md border p-0.5">
      {VIEWS.filter((v) => views.includes(v.value)).map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          aria-label={label}
          onClick={() => onChange(v)}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            value === v ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
