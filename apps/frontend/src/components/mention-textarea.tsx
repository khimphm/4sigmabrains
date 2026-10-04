import { useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { useUsers } from '@/features/users/api'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'
import { UserAvatar } from './user-avatar'

// Ô nhập có gõ @ để nhắc tên. Trả về danh sách id người được nhắc còn trong nội dung.
export function useMentionState() {
  const [value, setValue] = useState('')
  const [mentioned, setMentioned] = useState<User[]>([])
  const mentionIds = useMemo(
    () => mentioned.filter((u) => value.includes(`@${u.name}`)).map((u) => u.id),
    [mentioned, value],
  )
  const reset = () => {
    setValue('')
    setMentioned([])
  }
  return { value, setValue, mentioned, setMentioned, mentionIds, reset }
}

export function MentionTextarea({ state, placeholder, className, onSubmit, rows = 3 }: {
  state: ReturnType<typeof useMentionState>
  placeholder?: string
  className?: string
  onSubmit?: () => void
  rows?: number
}) {
  const { data: users = [] } = useUsers()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(0)

  const matches = useMemo(() => {
    if (query === null) return []
    const q = query.toLowerCase()
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 6)
  }, [query, users])

  const detect = (text: string, caret: number) => {
    const m = /(?:^|\s)@([^\s@]{0,30})$/.exec(text.slice(0, caret))
    setQuery(m ? m[1] : null)
    setActive(0)
  }

  const pick = (u: User) => {
    const el = ref.current
    if (!el) return
    const caret = el.selectionStart
    const before = state.value.slice(0, caret).replace(/@([^\s@]{0,30})$/, `@${u.name} `)
    const next = before + state.value.slice(caret)
    state.setValue(next)
    state.setMentioned((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]))
    setQuery(null)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(before.length, before.length)
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (matches.length) {
      if (e.key === 'ArrowDown') return (e.preventDefault(), setActive((a) => (a + 1) % matches.length))
      if (e.key === 'ArrowUp') return (e.preventDefault(), setActive((a) => (a - 1 + matches.length) % matches.length))
      if (e.key === 'Enter' || e.key === 'Tab') return (e.preventDefault(), pick(matches[active]))
      if (e.key === 'Escape') return setQuery(null)
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        rows={rows}
        value={state.value}
        placeholder={placeholder ?? 'Viết nội dung… gõ @ để nhắc tên, Ctrl+Enter để gửi'}
        className={cn('resize-none', className)}
        onChange={(e) => {
          state.setValue(e.target.value)
          detect(e.target.value, e.target.selectionStart)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      {matches.length > 0 && (
        <div className="bg-popover absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-lg border p-1 shadow-lg">
          {matches.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => (e.preventDefault(), pick(u))}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                i === active && 'bg-accent text-accent-foreground',
              )}
            >
              <UserAvatar user={u} className="size-6" />
              <span className="min-w-0">
                <span className="block truncate">{u.name}</span>
                <span className="text-muted-foreground block truncate text-xs">{u.email}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Hiển thị nội dung, tô màu các @tên đã được nhắc
export function RichText({ text, mentionIds = [], className }: { text: string; mentionIds?: string[]; className?: string }) {
  const { data: users = [] } = useUsers()
  const names = users.filter((u) => mentionIds.includes(u.id)).map((u) => u.name)
  if (!names.length) return <p className={cn('text-sm whitespace-pre-wrap', className)}>{text}</p>
  const pattern = new RegExp(`(@(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'g')
  return (
    <p className={cn('text-sm whitespace-pre-wrap', className)}>
      {text.split(pattern).map((part, i) =>
        names.some((n) => part === `@${n}`) ? (
          <span key={i} className="bg-primary/10 text-primary rounded px-1 font-medium">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  )
}
