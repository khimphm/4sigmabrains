import { Check, Plus, Tag, X } from 'lucide-react'
import { useState } from 'react'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useTaskLabels } from '../api'

const FALLBACK = '#64748B'

// Nhãn: chấm màu theo Cài đặt + chữ (không chỉ dựa vào màu)
export function LabelChip({ name, color, onRemove, className }: {
  name: string
  color?: string
  onRemove?: () => void
  className?: string
}) {
  return (
    <span
      className={cn(
        'bg-card text-foreground inline-flex h-6 max-w-full items-center gap-1.5 rounded-md border px-2 text-xs font-semibold',
        className,
      )}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ background: color ?? FALLBACK }} aria-hidden />
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Bỏ nhãn ${name}`}
          className="text-muted-foreground hover:text-foreground -mr-1 grid size-4 cursor-pointer place-items-center rounded"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export function LabelPicker({ value, onChange, className, disabled }: {
  value: string[]
  onChange: (labels: string[]) => void
  className?: string
  disabled?: boolean
}) {
  const { labels, colorOf } = useTaskLabels()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])
  const custom = search.trim()
  const exists = labels.some((l) => l.name.toLowerCase() === custom.toLowerCase()) || value.includes(custom)
  // Nhãn đang gắn nhưng không còn trong Cài đặt vẫn hiện để bỏ được
  const extra = value.filter((v) => !labels.some((l) => l.name === v))

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {value.map((l) => (
        <LabelChip key={l} name={l} color={colorOf(l)} onRemove={disabled ? undefined : () => toggle(l)} />
      ))}
      {!disabled && (
        <Popover open={open} onOpenChange={(o) => (setOpen(o), o || setSearch(''))}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:border-border-strong hover:text-foreground focus-visible:ring-ring/50 inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-dashed px-2 text-xs font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
            >
              {value.length ? <Plus className="size-3" /> : <Tag className="size-3" />}
              {value.length ? 'Thêm' : 'Thêm nhãn'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-0" align="start">
            <Command>
              <CommandInput placeholder="Tìm hoặc tạo nhãn…" value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty className="py-3 text-center text-xs">Không có nhãn phù hợp</CommandEmpty>
                <CommandGroup heading="Nhãn của workspace">
                  {[...labels.map((l) => l.name), ...extra].map((name) => (
                    <CommandItem key={name} value={name} onSelect={() => toggle(name)} className="cursor-pointer">
                      <span className="size-2.5 rounded-full" style={{ background: colorOf(name) ?? FALLBACK }} aria-hidden />
                      <span className="flex-1">{name}</span>
                      {value.includes(name) && <Check className="text-primary size-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {custom && !exists && (
                  <CommandGroup>
                    <CommandItem
                      value={`__create__${custom}`}
                      onSelect={() => {
                        onChange([...value, custom])
                        setSearch('')
                      }}
                      className="cursor-pointer"
                    >
                      <Plus className="size-4" /> Tạo nhãn “{custom}”
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
