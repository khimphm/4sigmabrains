import { AtSign, Paperclip } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { useUsers } from '@/features/users/api'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'
import { UserAvatar } from './user-avatar'

// Ô nhập có gõ @ để nhắc tên. Trả về danh sách id người được nhắc còn trong nội dung.
export function useMentionState(initial?: { value?: string; mentioned?: User[] }) {
  const [value, setValue] = useState(initial?.value ?? '')
  const [mentioned, setMentioned] = useState<User[]>(initial?.mentioned ?? [])
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

// variant "boxed": khung giống Figma (ô nhập + thanh công cụ @, đính kèm và nút gửi bên phải)
export function MentionTextarea({
  state,
  placeholder,
  className,
  onSubmit,
  rows = 3,
  variant = 'plain',
  actions,
  onAttach,
  autoFocus,
  disabled,
}: {
  state: ReturnType<typeof useMentionState>
  placeholder?: string
  className?: string
  onSubmit?: () => void
  rows?: number
  variant?: 'plain' | 'boxed'
  actions?: ReactNode
  onAttach?: (files: FileList) => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  const { data: users = [] } = useUsers()
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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

  // Nút @: chèn ký tự @ tại con trỏ và mở gợi ý
  const startMention = () => {
    const el = ref.current
    if (!el) return
    const caret = el.selectionStart ?? state.value.length
    const before = state.value.slice(0, caret)
    const insert = before && !/\s$/.test(before) ? ' @' : '@'
    const next = before + insert + state.value.slice(caret)
    state.setValue(next)
    const pos = caret + insert.length
    setQuery('')
    setActive(0)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos, pos)
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

  const boxed = variant === 'boxed'
  const textarea = (
    <Textarea
      ref={ref}
      rows={rows}
      value={state.value}
      autoFocus={autoFocus}
      disabled={disabled}
      placeholder={placeholder ?? 'Viết nội dung… gõ @ để nhắc tên, Ctrl+Enter để gửi'}
      className={cn(
        'resize-none',
        boxed && 'min-h-0 border-0 bg-transparent px-3.5 pt-3 shadow-none focus-visible:ring-0 dark:bg-transparent',
        className,
      )}
      onChange={(e) => {
        state.setValue(e.target.value)
        detect(e.target.value, e.target.selectionStart)
      }}
      onKeyDown={onKeyDown}
      onBlur={() => setTimeout(() => setQuery(null), 150)}
    />
  )
  const suggestions = matches.length > 0 && (
    <div
      role="listbox"
      aria-label="Gợi ý thành viên"
      className="bg-popover text-popover-foreground shadow-pop absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-lg border p-1"
    >
      {matches.map((u, i) => (
        <button
          key={u.id}
          type="button"
          role="option"
          aria-selected={i === active}
          onMouseDown={(e) => (e.preventDefault(), pick(u))}
          onMouseEnter={() => setActive(i)}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
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
  )

  if (!boxed)
    return (
      <div className="relative">
        {textarea}
        {suggestions}
      </div>
    )

  return (
    <div className="border-border-strong bg-card focus-within:border-ring focus-within:ring-ring/40 relative rounded-[10px] border transition-shadow focus-within:ring-[3px] dark:bg-input/30">
      {textarea}
      {suggestions}
      <div className="flex items-center gap-1 px-2 pb-2">
        {onAttach && (
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) onAttach(e.target.files)
                e.target.value = ''
              }}
            />
            <ToolbarButton label="Đính kèm tệp" onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-4" strokeWidth={1.8} />
            </ToolbarButton>
          </>
        )}
        <ToolbarButton label="Nhắc tên thành viên" onClick={startMention}>
          <AtSign className="size-4" strokeWidth={1.8} />
        </ToolbarButton>
        <span className="text-muted-foreground ml-1 hidden text-xs sm:inline">Ctrl+Enter để gửi</span>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </div>
  )
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-muted-foreground hover:bg-subtle hover:text-foreground focus-visible:ring-ring/50 grid size-8 cursor-pointer place-items-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
    >
      {children}
    </button>
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
          <span key={i} className="text-primary font-semibold">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  )
}
