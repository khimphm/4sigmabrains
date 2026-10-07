import { FileImage, FileText, MoreHorizontal, ScanSearch, Search, Trash2, Upload, UserCheck, UserPen, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { Pill } from '@/components/pill'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'

import {
  datasetFileUrl,
  DRAWING_STATUS,
  DRAWING_STATUSES,
  useBatchDrawings,
  useRemoveDrawing,
  useUpdateDrawingRow,
  type DrawingBatch,
  type DrawingRow,
  type DrawingStatus,
} from './api'

export function BatchDrawings({ batch, canManage, onUpload }: { batch?: DrawingBatch; canManage: boolean; onUpload: () => void }) {
  const drawings = useBatchDrawings(batch?.id)
  const navigate = useNavigate()
  const [status, setStatus] = useState<DrawingStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [deleting, setDeleting] = useState<DrawingRow | null>(null)
  const remove = useRemoveDrawing()

  const rows = useMemo(() => drawings.data ?? [], [drawings.data])
  const counts = useMemo(() => {
    const c = Object.fromEntries(DRAWING_STATUSES.map((s) => [s, 0])) as Record<DrawingStatus, number>
    for (const r of rows) c[r.status]++
    return c
  }, [rows])
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (!term || r.code.toLowerCase().includes(term) || r.title?.toLowerCase().includes(term) || r.fileName.toLowerCase().includes(term)),
    )
  }, [rows, status, q])

  const open = (r: DrawingRow) => navigate(`/dataset/drawings/${r.id}`)

  if (!batch)
    return (
      <section className="bg-card shadow-card rounded-[10px] border p-4">
        <EmptyState icon={ScanSearch} title="Chọn một đợt bản vẽ" description="Danh sách bản vẽ của đợt sẽ hiện ở đây." className="border-0" />
      </section>
    )

  return (
    <section className="bg-card shadow-card min-w-0 rounded-[10px] border" aria-labelledby="drawings-title">
      <div className="space-y-3 border-b p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="drawings-title" className="truncate text-[17px] font-bold">
              {batch.name}
              <span className="num text-muted-foreground ml-2 text-sm font-semibold">{batch.total} bản vẽ</span>
            </h2>
            {batch.description && <p className="text-text-secondary mt-0.5 line-clamp-2 text-sm">{batch.description}</p>}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên bản vẽ…" aria-label="Tìm bản vẽ" className="h-8 pl-9" />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Xoá từ khoá"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Lọc theo trạng thái">
          <StatusChip active={status === 'all'} onClick={() => setStatus('all')} label="Tất cả" count={rows.length} />
          {DRAWING_STATUSES.map((s) => (
            <StatusChip key={s} active={status === s} onClick={() => setStatus(s)} label={DRAWING_STATUS[s].label} count={counts[s]} dot={DRAWING_STATUS[s].bar} />
          ))}
        </div>
      </div>

      {drawings.isLoading ? (
        <div className="space-y-px p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-14 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Upload}
            title="Đợt này chưa có bản vẽ"
            description="Tải PDF hoặc ảnh bản vẽ lên để bắt đầu gán nhãn lỗi."
            action={
              <Button variant="outline" onClick={onUpload}>
                <Upload strokeWidth={1.8} />
                Tải bản vẽ lên
              </Button>
            }
          />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground px-4 py-10 text-center text-sm">Không có bản vẽ phù hợp bộ lọc.</p>
      ) : (
        <>
          {/* Bảng (máy tính) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-muted-foreground bg-subtle border-b text-left text-xs">
                  <th className="px-4 py-2.5 font-semibold">Bản vẽ</th>
                  <th className="px-3 py-2.5 font-semibold">Trạng thái</th>
                  <th className="px-3 py-2.5 font-semibold">Người gán nhãn</th>
                  <th className="px-3 py-2.5 font-semibold">Người duyệt</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Vùng lỗi</th>
                  <th className="px-3 py-2.5 font-semibold">Cập nhật</th>
                  {canManage && (
                    <th className="w-10 px-2 py-2.5">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => open(r)}
                    onKeyDown={(e) => e.key === 'Enter' && open(r)}
                    className="group hover:bg-subtle focus-visible:bg-subtle cursor-pointer border-b outline-none transition-colors last:border-0"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <DrawingThumb row={r} />
                        <div className="min-w-0">
                          <p className="group-hover:text-primary truncate font-semibold transition-colors">{r.code}</p>
                          <p className="text-muted-foreground truncate text-xs">{r.title || r.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Person user={r.labeler} empty="Chưa giao" />
                    </td>
                    <td className="px-3 py-2.5">
                      <Person user={r.reviewer} empty="—" />
                    </td>
                    <td className="num px-3 py-2.5 text-right font-semibold">{r.annotationCount}</td>
                    <td className="text-text-secondary px-3 py-2.5 text-xs whitespace-nowrap" title={fmtDateTime(r.updatedAt)}>
                      {fromNow(r.updatedAt)}
                    </td>
                    {canManage && (
                      <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <RowMenu row={r} onDelete={() => setDeleting(r)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Thẻ (di động) */}
          <ul className="divide-y md:hidden">
            {visible.map((r) => (
              <li key={r.id} className="flex items-center gap-1 pr-2">
                <button type="button" onClick={() => open(r)} className="hover:bg-subtle flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-3 text-left transition-colors">
                  <DrawingThumb row={r} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{r.code}</p>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="text-muted-foreground truncate text-xs">{r.title || r.fileName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {r.labeler?.name ?? 'Chưa giao'} · <span className="num">{r.annotationCount}</span> vùng lỗi
                    </p>
                  </div>
                </button>
                {canManage && <RowMenu row={r} onDelete={() => setDeleting(r)} />}
              </li>
            ))}
          </ul>
        </>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bản vẽ {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>Bản vẽ và {deleting?.annotationCount ?? 0} vùng lỗi đã khoanh sẽ bị xoá vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast.success('Đã xoá bản vẽ'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Xoá bản vẽ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

export function StatusPill({ status }: { status: DrawingStatus }) {
  const meta = DRAWING_STATUS[status]
  return <Pill tone={meta.tone}>{meta.label}</Pill>
}

function StatusChip({ active, onClick, label, count, dot }: { active: boolean; onClick: () => void; label: string; count: number; dot?: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-150',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        active ? 'border-foreground bg-foreground text-background' : 'bg-card text-text-secondary hover:border-border-strong hover:text-foreground',
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />}
      {label}
      <span className={cn('num', active ? 'opacity-70' : 'text-muted-foreground')}>{count}</span>
    </button>
  )
}

function DrawingThumb({ row }: { row: DrawingRow }) {
  const [broken, setBroken] = useState(false)
  const isImage = row.mimeType.startsWith('image/')
  if (isImage && !broken)
    return (
      <span className="bg-subtle block h-10 w-14 shrink-0 overflow-hidden rounded-md border">
        <img src={datasetFileUrl(row.id)} alt="" loading="lazy" onError={() => setBroken(true)} className="size-full object-cover" />
      </span>
    )
  const Icon = isImage ? FileImage : FileText
  return (
    <span className="relative grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-[#0F172A] text-[#7FA2FF]">
      <span
        aria-hidden
        className="absolute inset-0 opacity-30 [background-image:linear-gradient(#334155_1px,transparent_1px),linear-gradient(90deg,#334155_1px,transparent_1px)] [background-size:8px_8px]"
      />
      <Icon className="relative size-4" strokeWidth={1.8} aria-hidden />
      {row.pageCount > 1 && <span className="absolute right-0.5 bottom-0.5 rounded-sm bg-black/50 px-0.5 text-[9px] font-bold text-white">{row.pageCount}tr</span>}
    </span>
  )
}

function Person({ user, empty }: { user: User | null; empty: string }) {
  if (!user) return <span className="text-muted-foreground text-xs">{empty}</span>
  return (
    <span className="flex min-w-0 items-center gap-2">
      <UserAvatar user={user} className="size-6" />
      <span className="truncate text-xs font-medium">{user.name}</span>
    </span>
  )
}

function RowMenu({ row, onDelete }: { row: DrawingRow; onDelete: () => void }) {
  const users = useUsers()
  const update = useUpdateDrawingRow()
  const staff = (users.data ?? []).filter((u) => u.role !== 'CLIENT' && u.status === 'ACTIVE')
  const assign = (field: 'labelerId' | 'reviewerId', id: string | null) =>
    update.mutate(
      { id: row.id, [field]: id },
      {
        onSuccess: () => toast.success(field === 'labelerId' ? 'Đã giao người gán nhãn' : 'Đã giao người duyệt'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  const people = (field: 'labelerId' | 'reviewerId', current: string | null) => (
    <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto">
      {staff.map((u) => (
        <DropdownMenuItem key={u.id} onSelect={() => assign(field, u.id)} className={cn(current === u.id && 'bg-primary-soft text-primary')}>
          <UserAvatar user={u} className="size-5" />
          <span className="truncate">{u.name}</span>
        </DropdownMenuItem>
      ))}
      {current && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => assign(field, null)}>Bỏ giao</DropdownMenuItem>
        </>
      )}
    </DropdownMenuSubContent>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${row.code}`} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-muted-foreground text-xs">{row.code}</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserPen strokeWidth={1.8} />
            Người gán nhãn
          </DropdownMenuSubTrigger>
          {people('labelerId', row.labelerId)}
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserCheck strokeWidth={1.8} />
            Người duyệt
          </DropdownMenuSubTrigger>
          {people('reviewerId', row.reviewerId)}
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 strokeWidth={1.8} />
          Xoá bản vẽ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
