import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/api'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ChecklistItem, TaskDetail } from '@/types/api'
import { useChecklist } from '../api'
import { SectionCard } from './section-card'

export function ChecklistCard({ task }: { task: TaskDetail }) {
  const items = task.checklist ?? []
  const { add, update, remove } = useChecklist(task.id)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const doneCount = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const submit = () => {
    const content = text.trim()
    if (!content) return setAdding(false)
    add.mutate(content, { onSuccess: () => setText(''), onError: (e) => toast.error(errorMessage(e)) })
  }

  return (
    <SectionCard
      title="Checklist"
      aside={
        items.length > 0 && (
          <div className="flex w-full items-center gap-3">
            <div
              className="bg-subtle h-1.5 w-full min-w-16 overflow-hidden rounded-full sm:w-48 md:w-72 lg:w-96"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến độ checklist"
            >
              <div
                className={cn('h-full rounded-full transition-[width] duration-300', pct === 100 ? 'bg-on-time-foreground' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="num text-sm font-semibold">
              {doneCount}/{items.length}
            </span>
          </div>
        )
      }
    >
      <ul className="divide-border border-border divide-y border-t">
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            onToggle={(done) => update.mutate({ id: item.id, done }, { onError: (e) => toast.error(errorMessage(e)) })}
            onRename={(content) =>
              update.mutate({ id: item.id, content }, { onError: (e) => toast.error(errorMessage(e)) })
            }
            onRemove={() => remove.mutate(item.id, { onError: (e) => toast.error(errorMessage(e)) })}
          />
        ))}
      </ul>
      <div className={cn(items.length && 'border-t', 'pt-3')}>
        {adding ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
                if (e.key === 'Escape') {
                  setAdding(false)
                  setText('')
                }
              }}
              maxLength={500}
              aria-label="Nội dung mục checklist"
              placeholder="Nội dung mục, Enter để thêm tiếp"
              className="h-9"
            />
            <Button size="sm" variant="outline" onClick={submit} disabled={add.isPending || !text.trim()}>
              {add.isPending ? <Loader2 className="animate-spin" /> : 'Thêm'}
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => (setAdding(false), setText(''))} aria-label="Đóng">
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-primary hover:text-primary-hover focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1 rounded text-sm font-semibold transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <Plus className="size-4" /> Thêm mục checklist
          </button>
        )}
      </div>
    </SectionCard>
  )
}

function Row({
  item,
  onToggle,
  onRename,
  onRemove,
}: {
  item: ChecklistItem
  onToggle: (done: boolean) => void
  onRename: (content: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState(item.content)
  const commit = () => {
    const t = v.trim()
    if (t && t !== item.content) onRename(t)
    setEditing(false)
  }

  return (
    <li className="group flex min-h-12 items-center gap-3 py-2">
      <Checkbox
        checked={item.done}
        onCheckedChange={(c) => onToggle(!!c)}
        aria-label={`${item.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong'}: ${item.content}`}
        className="size-[18px]"
      />
      {editing ? (
        <Input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              setV(item.content)
              setEditing(false)
            }
          }}
          maxLength={500}
          aria-label="Sửa mục checklist"
          className="h-8 flex-1"
        />
      ) : (
        <div className="min-w-0 flex-1">
          <span
            onDoubleClick={() => (setV(item.content), setEditing(true))}
            className={cn('text-[15px] break-words transition-colors', item.done && 'text-muted-foreground line-through')}
          >
            {item.content}
          </span>
          {item.done && (
            <span className="text-muted-foreground block text-xs sm:hidden">
              {item.completedBy?.name ?? 'Đã xong'}
              {item.completedAt && `, ${fmtDate(item.completedAt, 'dd/MM HH:mm')}`}
            </span>
          )}
        </div>
      )}
      {!editing && (
        <>
          <span
            className="text-muted-foreground hidden shrink-0 text-[13px] sm:inline"
            title={item.done && item.completedAt ? `Xong lúc ${fmtDateTime(item.completedAt)}` : undefined}
          >
            {item.done ? (
              <span className="inline-flex items-center gap-1">
                <Check className="text-on-time-foreground size-3.5" aria-hidden />
                {item.completedBy?.name ?? 'Đã xong'}
                {item.completedAt && `, ${fmtDate(item.completedAt, 'dd/MM')}`}
              </span>
            ) : (
              'Chưa làm'
            )}
          </span>
          <div className="flex shrink-0 gap-0.5 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => (setV(item.content), setEditing(true))}
              aria-label={`Sửa mục ${item.content}`}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="hover:text-destructive"
              onClick={onRemove}
              aria-label={`Xoá mục ${item.content}`}
            >
              <Trash2 />
            </Button>
          </div>
        </>
      )}
    </li>
  )
}
