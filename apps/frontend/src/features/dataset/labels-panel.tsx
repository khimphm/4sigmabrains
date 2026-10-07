import { Archive, ArchiveRestore, Check, Loader2, Pencil, Plus, Settings2, Tags, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

import { useLabelTypes, useRemoveLabel, useSaveLabel, type DatasetStats, type LabelType } from './api'

const SWATCHES = ['#F0813F', '#E5484D', '#D6409F', '#8E4EC6', '#4F7CF5', '#0EA5E9', '#38B2A0', '#46A758', '#E0A82E', '#6B7280']

export function LabelChip({ label, count, className }: { label: Pick<LabelType, 'name' | 'color'>; count?: number; className?: string }) {
  return (
    <span
      className={cn('bg-card text-foreground inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold', className)}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
      <span className="truncate">{label.name}</span>
      {count !== undefined && <span className="num text-muted-foreground font-medium">{count}</span>}
    </span>
  )
}

// Thẻ "Bộ nhãn lỗi" bên phải trang dataset
export function LabelsPanel({ stats, canManage }: { stats?: DatasetStats; canManage: boolean }) {
  const labels = useLabelTypes()
  const [managing, setManaging] = useState(false)
  const active = labels.data?.filter((l) => l.active) ?? []
  const countOf = (id: string) => stats?.byLabel.find((b) => b.id === id)?.count
  const max = Math.max(1, ...(stats?.byLabel.map((b) => b.count) ?? [0]))

  return (
    <section className="bg-card shadow-card rounded-[10px] border p-4" aria-labelledby="labels-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="labels-title" className="text-[17px] font-bold">
          Bộ nhãn lỗi
        </h2>
        {canManage && (
          <Button variant="ghost" size="sm" onClick={() => setManaging(true)}>
            <Settings2 strokeWidth={1.8} />
            Quản lý
          </Button>
        )}
      </div>
      {labels.isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[80, 110, 140, 96, 120].map((w) => (
            <Skeleton key={w} className="h-7 rounded-full" style={{ width: w }} />
          ))}
        </div>
      ) : active.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có nhãn lỗi nào.{canManage && ' Bấm “Quản lý” để thêm.'}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {active.map((l) => (
            <Tooltip key={l.id}>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="focus-visible:ring-ring/50 max-w-full rounded-full outline-none focus-visible:ring-[3px]">
                  <LabelChip label={l} />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{l.description || l.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {stats && stats.byLabel.some((b) => b.count > 0) && (
        <div className="mt-4 border-t pt-3">
          <h3 className="text-text-secondary mb-2 text-[13px] font-semibold">Phân bố vùng lỗi đã khoanh</h3>
          <ul className="space-y-2">
            {stats.byLabel
              .filter((b) => b.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 6)
              .map((b) => (
                <li key={b.id} className="text-xs">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{b.name}</span>
                    <span className="num text-muted-foreground">{countOf(b.id)}</span>
                  </div>
                  <div className="bg-subtle h-1.5 overflow-hidden rounded-full">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(b.count / max) * 100}%`, backgroundColor: b.color }} />
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
      <p className="text-muted-foreground mt-4 text-xs leading-relaxed">Bộ nhãn lấy từ kết luận đã chốt ở mục Phân tích và chốt.</p>

      {canManage && <ManageLabelsSheet open={managing} onOpenChange={setManaging} labels={labels.data ?? []} />}
    </section>
  )
}

function ManageLabelsSheet({ open, onOpenChange, labels }: { open: boolean; onOpenChange: (o: boolean) => void; labels: LabelType[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const save = useSaveLabel()
  const remove = useRemoveLabel()
  const sorted = [...labels].sort((a, b) => Number(b.active) - Number(a.active) || a.position - b.position)

  const toggleArchive = (l: LabelType) =>
    save.mutate(
      { id: l.id, name: l.name, active: !l.active },
      {
        onSuccess: () => toast.success(l.active ? 'Đã lưu trữ nhãn' : 'Đã khôi phục nhãn'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <Tags className="size-[18px]" strokeWidth={1.8} aria-hidden />
            Quản lý bộ nhãn lỗi
          </SheetTitle>
          <SheetDescription>Nhãn đã được dùng sẽ được lưu trữ thay vì xoá để giữ dữ liệu cũ.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {adding ? (
            <LabelForm onDone={() => setAdding(false)} />
          ) : (
            <Button variant="outline" className="w-full border-dashed" onClick={() => setAdding(true)}>
              <Plus strokeWidth={1.8} />
              Thêm nhãn lỗi
            </Button>
          )}
          {sorted.map((l) =>
            editing === l.id ? (
              <LabelForm key={l.id} label={l} onDone={() => setEditing(null)} />
            ) : (
              <div key={l.id} className={cn('group flex items-start gap-3 rounded-[10px] border p-3 transition-colors', !l.active && 'bg-subtle opacity-70')}>
                <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{l.name}</span>
                    {!l.active && <span className="text-muted-foreground text-xs font-medium">Đã lưu trữ</span>}
                  </p>
                  {l.description && <p className="text-text-secondary mt-0.5 text-xs">{l.description}</p>}
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="ghost" size="icon-sm" aria-label={`Sửa ${l.name}`} onClick={() => setEditing(l.id)}>
                    <Pencil strokeWidth={1.8} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={l.active ? `Lưu trữ ${l.name}` : `Khôi phục ${l.name}`} onClick={() => toggleArchive(l)}>
                    {l.active ? <Archive strokeWidth={1.8} /> : <ArchiveRestore strokeWidth={1.8} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá ${l.name}`}
                    className="hover:text-destructive"
                    onClick={() =>
                      remove.mutate(l.id, {
                        onSuccess: (r) => toast.success(r?.archived ? 'Nhãn đã được dùng nên chỉ lưu trữ' : 'Đã xoá nhãn'),
                        onError: (e) => toast.error(errorMessage(e)),
                      })
                    }
                  >
                    <Trash2 strokeWidth={1.8} />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function LabelForm({ label, onDone }: { label?: LabelType; onDone: () => void }) {
  const save = useSaveLabel()
  const [name, setName] = useState(label?.name ?? '')
  const [description, setDescription] = useState(label?.description ?? '')
  const [color, setColor] = useState(label?.color ?? SWATCHES[0])
  const valid = name.trim().length >= 2

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    save.mutate(
      { id: label?.id, name: name.trim(), description: description.trim() || null, color },
      {
        onSuccess: () => {
          toast.success(label ? 'Đã lưu nhãn' : 'Đã thêm nhãn')
          onDone()
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <form onSubmit={submit} className="border-primary/40 bg-primary-soft/30 space-y-3 rounded-[10px] border p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`label-name-${label?.id ?? 'new'}`}>Tên nhãn</Label>
        <Input id={`label-name-${label?.id ?? 'new'}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Thiếu kích thước" autoFocus maxLength={100} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`label-desc-${label?.id ?? 'new'}`}>Mô tả cho người gán nhãn</Label>
        <Textarea id={`label-desc-${label?.id ?? 'new'}`} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Khi nào dùng nhãn này…" />
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Màu</legend>
        <div className="flex flex-wrap gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Màu ${c}`}
              aria-pressed={color === c}
              className={cn(
                'ring-offset-card grid size-7 cursor-pointer place-items-center rounded-full transition-transform duration-150 hover:scale-110',
                'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                color === c && 'ring-foreground ring-2 ring-offset-2',
              )}
              style={{ backgroundColor: c }}
            >
              {color === c && <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          <X strokeWidth={1.8} />
          Huỷ
        </Button>
        <Button type="submit" size="sm" variant="outline" disabled={!valid || save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" /> : <Check strokeWidth={1.8} />}
          {label ? 'Lưu' : 'Thêm nhãn'}
        </Button>
      </div>
    </form>
  )
}
