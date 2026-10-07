import { CalendarClock, Check, ChevronDown, Search, Tag, UserRound, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { DeadlineLegend } from '@/components/pill'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'
import { DUE_LABEL, type DueFilter, type ProjectTaskFilters } from './task-filters'

function FilterButton({ icon: Icon, label, value, active, children }: {
  icon: typeof Tag
  label: string
  value: ReactNode
  active: boolean
  children: ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 max-w-[260px] justify-start font-medium', active && 'border-primary/50 bg-primary-soft text-primary hover:bg-primary-soft')}
        >
          <Icon strokeWidth={1.8} />
          <span className="truncate">
            {label}: <span className={cn(!active && 'text-text-secondary')}>{value}</span>
          </span>
          <ChevronDown className="ml-auto opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-52 overflow-y-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const Item = ({ on, onSelect, children }: { on: boolean; onSelect: () => void; children: ReactNode }) => (
  <DropdownMenuItem onSelect={onSelect} className="gap-2">
    {children}
    <Check className={cn('ml-auto size-4', !on && 'opacity-0')} />
  </DropdownMenuItem>
)

export function TaskFilterBar({ value, onChange, members, labels, meId }: {
  value: ProjectTaskFilters
  onChange: (v: ProjectTaskFilters) => void
  members: User[]
  labels: { name: string; color: string }[]
  meId?: string
}) {
  const set = <K extends keyof ProjectTaskFilters>(k: K, v: ProjectTaskFilters[K]) => onChange({ ...value, [k]: v })
  const person =
    value.assignee === 'me'
      ? 'Của tôi'
      : value.assignee === 'none'
        ? 'Chưa giao'
        : (members.find((m) => m.id === value.assignee)?.name ?? 'Tất cả')
  const any = !!(value.q || value.assignee || value.due || value.label)

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      <div className="contents">
        <div className="relative w-full sm:w-60">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={value.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Tìm theo tên, mã việc"
            aria-label="Tìm công việc"
            className="bg-card h-9 pl-8"
          />
        </div>

        <FilterButton icon={UserRound} label="Người phụ trách" value={person} active={!!value.assignee}>
          <Item on={!value.assignee} onSelect={() => set('assignee', null)}>
            Tất cả
          </Item>
          {meId && (
            <Item on={value.assignee === 'me'} onSelect={() => set('assignee', 'me')}>
              Việc của tôi
            </Item>
          )}
          <Item on={value.assignee === 'none'} onSelect={() => set('assignee', 'none')}>
            Chưa giao
          </Item>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground text-xs">Thành viên dự án</DropdownMenuLabel>
          {members.map((m) => (
            <Item key={m.id} on={value.assignee === m.id} onSelect={() => set('assignee', m.id)}>
              <UserAvatar user={m} className="size-5" />
              <span className="truncate">{m.name}</span>
            </Item>
          ))}
        </FilterButton>

        <FilterButton icon={CalendarClock} label="Hạn" value={value.due ? DUE_LABEL[value.due] : 'Tất cả'} active={!!value.due}>
          <Item on={!value.due} onSelect={() => set('due', null)}>
            Tất cả
          </Item>
          <DropdownMenuSeparator />
          {(Object.keys(DUE_LABEL) as DueFilter[]).map((d) => (
            <Item key={d} on={value.due === d} onSelect={() => set('due', d)}>
              {DUE_LABEL[d]}
            </Item>
          ))}
        </FilterButton>

        <FilterButton icon={Tag} label="Nhãn" value={value.label ?? 'Tất cả'} active={!!value.label}>
          <Item on={!value.label} onSelect={() => set('label', null)}>
            Tất cả nhãn
          </Item>
          <DropdownMenuSeparator />
          {labels.map((l) => (
            <Item key={l.name} on={value.label === l.name} onSelect={() => set('label', l.name)}>
              <span className="size-2.5 rounded-full" style={{ background: l.color }} aria-hidden />
              <span className="truncate">{l.name}</span>
            </Item>
          ))}
          {!labels.length && <p className="text-muted-foreground px-2 py-1.5 text-sm">Chưa có nhãn</p>}
        </FilterButton>

        {/* Lọc nhanh theo avatar thành viên */}
        <div className="hidden items-center -space-x-1.5 pl-1 2xl:flex" role="group" aria-label="Lọc nhanh theo người">
          {members.slice(0, 6).map((m) => {
            const on = value.assignee === m.id
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                title={m.name}
                aria-label={`Lọc việc của ${m.name}`}
                onClick={() => set('assignee', on ? null : m.id)}
                className={cn(
                  'cursor-pointer rounded-full transition-transform duration-150 hover:z-10 hover:-translate-y-0.5',
                  on ? 'ring-primary z-10 ring-2' : 'ring-background ring-2',
                  value.assignee && !on && 'opacity-50',
                )}
              >
                <UserAvatar user={m} className="size-7" />
              </button>
            )
          })}
        </div>

        {any && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onChange({ q: '', assignee: null, due: null, label: null })}>
            <X /> Xoá lọc
          </Button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
        <span className="text-muted-foreground hidden text-xs font-medium 2xl:inline">Chú thích hạn:</span>
        <DeadlineLegend className="flex-nowrap gap-2.5" />
      </div>
    </div>
  )
}
