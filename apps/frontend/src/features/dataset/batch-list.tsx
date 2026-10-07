import { FolderPlus, Layers, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

import { useRemoveBatch, type DrawingBatch } from './api'
import { BatchDialog } from './batch-dialog'

export function BatchList({ batches, loading, selectedId, onSelect, canManage }: {
  batches: DrawingBatch[]
  loading: boolean
  selectedId?: string
  onSelect: (id: string) => void
  canManage: boolean
}) {
  const [dialog, setDialog] = useState<{ batch: DrawingBatch | null } | null>(null)
  const [deleting, setDeleting] = useState<DrawingBatch | null>(null)
  const remove = useRemoveBatch()

  return (
    <section className="bg-card shadow-card rounded-[10px] border" aria-labelledby="batches-title">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 id="batches-title" className="flex items-center gap-2 text-[15px] font-bold">
          <Layers className="text-muted-foreground size-4" strokeWidth={1.8} aria-hidden />
          Đợt bản vẽ
          {!loading && <span className="num text-muted-foreground text-xs font-semibold">{batches.length}</span>}
        </h2>
        {canManage && (
          <Button variant="ghost" size="icon-sm" aria-label="Tạo đợt bản vẽ" onClick={() => setDialog({ batch: null })}>
            <Plus strokeWidth={1.8} />
          </Button>
        )}
      </div>
      <div className="max-h-[420px] space-y-1 overflow-y-auto p-2 lg:max-h-[calc(100vh-320px)]">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[74px] w-full rounded-lg" />)
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <FolderPlus className="text-muted-foreground size-6" strokeWidth={1.6} aria-hidden />
            <p className="text-text-secondary text-sm">Chưa có đợt bản vẽ nào.</p>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setDialog({ batch: null })}>
                Tạo đợt đầu tiên
              </Button>
            )}
          </div>
        ) : (
          batches.map((b) => {
            const active = b.id === selectedId
            const pctApproved = b.total ? (b.approved / b.total) * 100 : 0
            const pctReview = b.total ? (b.inReview / b.total) * 100 : 0
            return (
              <div key={b.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(b.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors duration-150',
                    'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                    active ? 'bg-primary-soft' : 'hover:bg-subtle',
                  )}
                >
                  <div className="flex items-center gap-2 pr-7">
                    <span className={cn('truncate text-sm font-semibold', active && 'text-primary')}>{b.name}</span>
                  </div>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                    {b.project && (
                      <>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: b.project.color }} aria-hidden />
                        <span className="truncate">{b.project.name}</span>
                        <span aria-hidden>·</span>
                      </>
                    )}
                    <span className="num shrink-0">{b.total} bản vẽ</span>
                  </div>
                  <div
                    className="bg-subtle mt-2 flex h-1.5 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={b.total}
                    aria-valuenow={b.approved}
                    aria-label={`${b.approved}/${b.total} bản vẽ đã duyệt`}
                  >
                    <div className="bg-on-time-foreground h-full transition-[width] duration-500" style={{ width: `${pctApproved}%` }} />
                    <div className="bg-due-soon-foreground h-full transition-[width] duration-500" style={{ width: `${pctReview}%` }} />
                  </div>
                  <div className="text-muted-foreground mt-1 flex justify-between text-[11px]">
                    <span className="num">
                      {b.approved}/{b.total} đã duyệt
                    </span>
                    {b.inReview > 0 && <span className="num">{b.inReview} chờ duyệt</span>}
                  </div>
                </button>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Thao tác với ${b.name}`}
                        className="absolute top-2 right-2 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setDialog({ batch: b })}>
                        <Pencil strokeWidth={1.8} />
                        Sửa đợt
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(b)}>
                        <Trash2 strokeWidth={1.8} />
                        Xoá đợt
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })
        )}
      </div>

      {dialog && (
        <BatchDialog
          key={dialog.batch?.id ?? 'new'}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          batch={dialog.batch}
          onSaved={(b) => onSelect(b.id)}
        />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá đợt “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.total
                ? `${deleting.total} bản vẽ cùng toàn bộ vùng lỗi đã khoanh trong đợt sẽ bị xoá vĩnh viễn.`
                : 'Đợt này chưa có bản vẽ nào.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => toast.success('Đã xoá đợt bản vẽ'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Xoá đợt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
