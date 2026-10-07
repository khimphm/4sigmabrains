import { Check, ChevronLeft, ChevronRight, Download, FileText, MessageSquareWarning, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/user-avatar'
import { fileSize, fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ANNOTATION_STATUS_META,
  DRAWING_STATUS_META,
  drawingFileUrl,
  useBatchDrawingList,
  type AnnotationPatch,
  type DatasetLabel,
  type DrawingAnnotation,
  type DrawingDetail,
} from './drawing-api'
import { DrawingPageView } from './drawing-page-view'
import type { DrawingSource } from './drawing-source'

export type ReviewMark = { status: 'APPROVED' | 'REJECTED'; note: string }

export function PanelCard({
  title,
  aside,
  children,
  className,
}: {
  title: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-card shadow-card rounded-[10px] border', className)}>
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h2 className="text-[17px] font-bold">{title}</h2>
        {aside}
      </header>
      <div className="px-4 pb-4">{children}</div>
    </section>
  )
}

// Ghi chú sửa tại chỗ
function InlineNote({
  value,
  editable,
  onSave,
}: {
  value: string | null
  editable: boolean
  onSave: (v: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  const commit = () => {
    setEditing(false)
    const v = text.trim() || null
    if (v !== (value ?? null)) onSave(v)
  }

  if (editing)
    return (
      <Textarea
        ref={ref}
        value={text}
        aria-label="Ghi chú cho vùng lỗi"
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            setText(value ?? '')
            setEditing(false)
          }
        }}
        className="mt-2 min-h-16 text-sm"
        placeholder="Mô tả lỗi, vd: thiếu cao độ đáy dầm"
      />
    )
  if (!editable)
    return value ? <p className="text-text-secondary mt-1.5 text-sm whitespace-pre-wrap">{value}</p> : null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setText(value ?? '')
        setEditing(true)
      }}
      className={cn(
        'hover:bg-subtle focus-visible:ring-ring/50 -mx-1.5 mt-1 block w-[calc(100%+12px)] cursor-text rounded-md px-1.5 py-1 text-left text-sm whitespace-pre-wrap transition-colors outline-none focus-visible:ring-[3px]',
        value ? 'text-text-secondary' : 'text-muted-foreground italic',
      )}
    >
      {value || 'Thêm ghi chú…'}
    </button>
  )
}

export function AnnotationList({
  annotations,
  numberOf,
  labels,
  selectedId,
  hoverId,
  onHover,
  onFocus,
  editable,
  canDelete,
  onUpdate,
  onDelete,
  reviewing,
  marks,
  onMark,
  showPage,
}: {
  annotations: DrawingAnnotation[]
  numberOf: (id: string) => number
  labels: DatasetLabel[]
  selectedId: string | null
  hoverId: string | null
  onHover: (id: string | null) => void
  onFocus: (a: DrawingAnnotation) => void
  editable: boolean
  canDelete: (a: DrawingAnnotation) => boolean
  onUpdate: (id: string, patch: AnnotationPatch) => void
  onDelete: (id: string) => void
  reviewing: boolean
  marks: Record<string, ReviewMark>
  onMark: (id: string, mark: ReviewMark | null) => void
  showPage: boolean
}) {
  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  useEffect(() => {
    if (selectedId) itemRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  if (!annotations.length)
    return (
      <EmptyState
        icon={MessageSquareWarning}
        title="Chưa có vùng lỗi nào"
        description={editable ? 'Chọn công cụ Khoanh vùng lỗi (B) rồi kéo trên bản vẽ.' : 'Bản vẽ này chưa được gán nhãn.'}
        className="py-8"
      />
    )

  return (
    <ul className="divide-border -mx-4 divide-y">
      {annotations.map((a) => {
        const n = numberOf(a.id)
        const mark = marks[a.id]
        const status = reviewing && mark ? mark.status : a.status
        const meta = ANNOTATION_STATUS_META[status]
        const selected = a.id === selectedId
        return (
          <li
            key={a.id}
            ref={(el) => {
              if (el) itemRefs.current.set(a.id, el)
              else itemRefs.current.delete(a.id)
            }}
            onMouseEnter={() => onHover(a.id)}
            onMouseLeave={() => onHover(null)}
            className={cn(
              'relative px-4 py-3 transition-colors duration-150',
              selected ? 'bg-primary-soft/60' : hoverId === a.id ? 'bg-subtle' : '',
            )}
          >
            {selected && <span className="bg-primary absolute inset-y-2 left-0 w-[3px] rounded-r" />}
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => onFocus(a)}
                aria-label={`Xem vùng lỗi số ${n} trên bản vẽ`}
                className="bg-annotation text-sidebar num focus-visible:ring-ring/50 mt-0.5 grid h-6 min-w-8 shrink-0 cursor-pointer place-items-center rounded-[4px] px-1 text-xs font-bold outline-none hover:brightness-95 focus-visible:ring-[3px]"
              >
                #{n}
              </button>
              <div className="min-w-0 flex-1">
                {editable && selected ? (
                  <Select value={a.labelTypeId} onValueChange={(v) => onUpdate(a.id, { labelTypeId: v })}>
                    <SelectTrigger size="sm" className="h-7 w-full text-[13px] font-semibold" aria-label="Đổi nhãn lỗi">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {labels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          <span className="size-2.5 rounded-full" style={{ background: l.color }} />
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <button
                    type="button"
                    onClick={() => onFocus(a)}
                    className="hover:text-primary flex w-full cursor-pointer items-center gap-1.5 text-left text-sm font-semibold transition-colors"
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: a.labelType.color }} aria-hidden />
                    <span className="truncate">{a.labelType.name}</span>
                  </button>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone={meta.tone} className="h-5 px-1.5 text-[11px]">
                    {meta.label}
                  </Pill>
                  {showPage && <span className="text-muted-foreground text-xs">Trang {a.page}</span>}
                </div>
                <InlineNote value={a.note} editable={editable} onSave={(note) => onUpdate(a.id, { note })} />
                {a.reviewNote && !reviewing && (
                  <p className="bg-late text-late-foreground mt-2 rounded-md px-2 py-1.5 text-xs">
                    <span className="font-semibold">Người duyệt: </span>
                    {a.reviewNote}
                  </p>
                )}
                <p className="text-muted-foreground mt-1.5 text-xs">Gán bởi {a.author?.name ?? 'Không rõ'}</p>

                {reviewing && (
                  <div className="mt-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={`Đánh giá vùng #${n}`}>
                      <button
                        type="button"
                        aria-pressed={mark?.status === 'APPROVED'}
                        onClick={() => onMark(a.id, mark?.status === 'APPROVED' ? null : { status: 'APPROVED', note: '' })}
                        className={cn(
                          'focus-visible:ring-ring/50 inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border text-[13px] font-semibold transition-colors outline-none focus-visible:ring-[3px]',
                          mark?.status === 'APPROVED'
                            ? 'bg-on-time text-on-time-foreground border-transparent'
                            : 'hover:bg-subtle text-text-secondary',
                        )}
                      >
                        <Check className="size-3.5" /> Đạt
                      </button>
                      <button
                        type="button"
                        aria-pressed={mark?.status === 'REJECTED'}
                        onClick={() =>
                          onMark(a.id, mark?.status === 'REJECTED' ? null : { status: 'REJECTED', note: mark?.note ?? '' })
                        }
                        className={cn(
                          'focus-visible:ring-ring/50 inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border text-[13px] font-semibold transition-colors outline-none focus-visible:ring-[3px]',
                          mark?.status === 'REJECTED'
                            ? 'bg-overdue text-overdue-foreground border-transparent'
                            : 'hover:bg-subtle text-text-secondary',
                        )}
                      >
                        <X className="size-3.5" /> Không đạt
                      </button>
                    </div>
                    {mark?.status === 'REJECTED' && (
                      <Textarea
                        value={mark.note}
                        maxLength={2000}
                        aria-label={`Lý do vùng #${n} không đạt`}
                        placeholder="Lý do / cần sửa gì"
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) => onMark(a.id, { status: 'REJECTED', note: e.target.value })}
                        className="min-h-14 text-sm"
                      />
                    )}
                  </div>
                )}
              </div>
              {editable && canDelete(a) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Xoá vùng lỗi #${n}`}
                      onClick={() => onDelete(a.id)}
                      className="text-muted-foreground hover:text-destructive -mr-1 shrink-0"
                    >
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Xoá (Delete)</TooltipContent>
                </Tooltip>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function LabelPalette({
  labels,
  activeId,
  onPick,
  disabled,
  loading,
}: {
  labels: DatasetLabel[]
  activeId: string | null
  onPick: (id: string) => void
  disabled: boolean
  loading?: boolean
}) {
  if (loading)
    return (
      <div className="flex flex-wrap gap-2">
        {[24, 20, 32, 28, 22].map((w) => (
          <Skeleton key={w} className="h-8 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
    )
  if (!labels.length)
    return <p className="text-muted-foreground text-sm">Chưa có nhãn lỗi. Quản lý thêm nhãn ở trang Dataset bản vẽ.</p>
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nhãn lỗi đang dùng">
        {labels.map((l, i) => {
          const active = l.id === activeId
          return (
            <Tooltip key={l.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => onPick(l.id)}
                  className={cn(
                    'focus-visible:ring-ring/50 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px] disabled:cursor-default',
                    active
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'text-text-secondary border-border-strong enabled:hover:bg-subtle enabled:hover:text-foreground',
                  )}
                >
                  <span className="size-2.5 rounded-full" style={{ background: l.color }} aria-hidden />
                  {l.name}
                  {i < 9 && !disabled && (
                    <kbd className="text-muted-foreground num ml-0.5 font-sans text-[11px] font-medium">{i + 1}</kbd>
                  )}
                </button>
              </TooltipTrigger>
              {l.description && <TooltipContent className="max-w-64">{l.description}</TooltipContent>}
            </Tooltip>
          )
        })}
      </div>
      <p className="text-muted-foreground mt-3 text-[13px]">
        {disabled
          ? 'Bộ nhãn lấy từ kết luận đã chốt ở mục Phân tích và chốt.'
          : 'Nhấn 1–9 để chọn nhãn. Khi đang chọn một vùng, nhãn mới sẽ áp cho vùng đó.'}
      </p>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  )
}

function Person({ user, empty }: { user: DrawingDetail['labeler']; empty: string }) {
  if (!user) return <span className="text-muted-foreground font-normal">{empty}</span>
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <UserAvatar user={user} className="size-5" />
      <span className="truncate">{user.name}</span>
    </span>
  )
}

export function DrawingInfo({ drawing, pageCount }: { drawing: DrawingDetail; pageCount: number }) {
  return (
    <dl className="divide-border -my-2 divide-y">
      <InfoRow label="Đợt">
        <Link to="/dataset" className="hover:text-primary truncate transition-colors">
          {drawing.batch.name}
        </Link>
      </InfoRow>
      <InfoRow label="Người gán">
        <Person user={drawing.labeler} empty="Chưa có" />
      </InfoRow>
      <InfoRow label="Người duyệt">
        <Person user={drawing.reviewer} empty="Chưa chỉ định" />
      </InfoRow>
      <InfoRow label="Số trang">
        <span className="num">{pageCount}</span>
      </InfoRow>
      {drawing.submittedAt && <InfoRow label="Gửi duyệt">{fmtDateTime(drawing.submittedAt)}</InfoRow>}
      {drawing.reviewedAt && <InfoRow label="Duyệt lúc">{fmtDateTime(drawing.reviewedAt)}</InfoRow>}
      <InfoRow label="Cập nhật">
        <span title={fmtDateTime(drawing.updatedAt)}>{fromNow(drawing.updatedAt)}</span>
      </InfoRow>
      <InfoRow label="Tệp gốc">
        <a
          href={drawingFileUrl(drawing.id)}
          target="_blank"
          rel="noreferrer"
          className="text-primary inline-flex max-w-full items-center gap-1 hover:underline"
        >
          <Download className="size-3.5 shrink-0" />
          <span className="truncate">{drawing.fileName}</span>
          <span className="text-muted-foreground shrink-0 font-normal">· {fileSize(drawing.size)}</span>
        </a>
      </InfoRow>
    </dl>
  )
}

// Thumbnail các trang PDF
export function PageThumbnails({
  source,
  page,
  onPageChange,
  countByPage,
  orientation = 'vertical',
}: {
  source: DrawingSource
  page: number
  onPageChange: (p: number) => void
  countByPage: Map<number, number>
  orientation?: 'vertical' | 'horizontal'
}) {
  const pages = source.sizes.slice(0, 200)
  return (
    <ol className={cn('gap-2', orientation === 'vertical' ? 'flex flex-col' : 'flex overflow-x-auto pb-1')}>
      {pages.map((s, i) => {
        const p = i + 1
        const active = p === page
        const n = countByPage.get(p) ?? 0
        return (
          <li key={p} className={orientation === 'horizontal' ? 'w-24 shrink-0' : undefined}>
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={active ? 'page' : undefined}
              aria-label={`Trang ${p}${n ? `, ${n} vùng lỗi` : ''}`}
              className={cn(
                'group focus-visible:ring-ring/50 w-full cursor-pointer rounded-lg border p-1.5 text-left transition-colors outline-none focus-visible:ring-[3px]',
                active ? 'border-primary bg-primary-soft' : 'hover:bg-subtle border-transparent',
              )}
            >
              <div
                className="relative overflow-hidden rounded-[4px] border bg-white"
                style={{ aspectRatio: `${s.width} / ${s.height}` }}
              >
                <DrawingPageView source={source} page={p} scale={0.25} />
                {n > 0 && (
                  <span className="bg-annotation text-sidebar num absolute top-1 right-1 rounded-[4px] px-1 text-[10px] font-bold">
                    {n}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'num mt-1 block text-center text-xs font-semibold',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                Trang {p}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// Danh sách bản vẽ cùng đợt + chuyển nhanh trước / sau
export function BatchSiblings({ drawing }: { drawing: DrawingDetail }) {
  const { data, isLoading } = useBatchDrawingList(drawing.batchId)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-1">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Trong đợt</h3>
        <div className="flex">
          <NavButton id={drawing.prevId} label="Bản vẽ trước" icon={ChevronLeft} />
          <NavButton id={drawing.nextId} label="Bản vẽ sau" icon={ChevronRight} />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <ul className="space-y-0.5">
          {(data ?? []).map((d) => {
            const active = d.id === drawing.id
            const meta = DRAWING_STATUS_META[d.status]
            return (
              <li key={d.id}>
                <Link
                  to={`/dataset/drawings/${d.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'focus-visible:ring-ring/50 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors outline-none focus-visible:ring-[3px]',
                    active ? 'bg-primary-soft text-primary' : 'hover:bg-subtle',
                  )}
                >
                  <FileText className="size-4 shrink-0 opacity-70" strokeWidth={1.8} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{d.code}</span>
                    <span className={cn('block truncate text-xs', active ? 'text-primary/80' : 'text-muted-foreground')}>
                      {meta.label}
                      {d.annotationCount > 0 && ` · ${d.annotationCount} nhãn`}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function NavButton({ id, label, icon: Icon }: { id: string | null; label: string; icon: typeof ChevronLeft }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {id ? (
          <Button variant="ghost" size="icon-xs" aria-label={label} asChild>
            <Link to={`/dataset/drawings/${id}`}>
              <Icon />
            </Link>
          </Button>
        ) : (
          <span>
            <Button variant="ghost" size="icon-xs" aria-label={label} disabled>
              <Icon />
            </Button>
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
