import { CalendarDays, KanbanSquare, List } from 'lucide-react'

import { cn } from '@/lib/utils'

export type TaskView = 'board' | 'list' | 'calendar'

const VIEWS = [
  { value: 'board', label: 'Kanban', icon: KanbanSquare },
  { value: 'list', label: 'Danh sách', icon: List },
  { value: 'calendar', label: 'Lịch', icon: CalendarDays },
] as const

export function ViewSwitcher({ value, onChange, views = ['board', 'list', 'calendar'] }: {
  value: TaskView
  onChange: (v: TaskView) => void
  views?: TaskView[]
}) {
  return (
    <div className="bg-muted inline-flex rounded-lg p-1">
      {VIEWS.filter((v) => views.includes(v.value)).map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            value === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
