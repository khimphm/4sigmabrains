import { Download, Eye, History, Loader2, MoreHorizontal, Share2, Trash2, Upload, UploadCloud, Users } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/use-auth'
import {
  type AttachmentTarget,
  attachmentUrl,
  fileKind,
  type FileKind,
  useAttachmentVersions,
  useAttachments,
} from '@/features/attachments'
import { errorMessage } from '@/lib/api'
import { fileSize, fmtDate, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Attachment } from '@/types/api'

const KIND_CLASS: Record<FileKind, string> = {
  pdf: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  cad: 'bg-primary-soft text-primary',
  sheet: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  doc: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  image: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  archive: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  other: 'bg-subtle text-text-secondary',
}

export function FileTag({ fileName, mimeType, className }: { fileName: string; mimeType?: string; className?: string }) {
  const { kind, tag } = fileKind(fileName, mimeType)
  return (
    <span
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-md text-[11px] font-bold tracking-wide',
        KIND_CLASS[kind],
        className,
      )}
      aria-label={`Loại tệp ${tag}`}
    >
      {tag}
    </span>
  )
}

// Danh sách tệp đính kèm: nhãn loại tệp, phiên bản, chia sẻ khách hàng, kéo thả để tải lên
export function AttachmentList({
  target,
  targetId,
  allowShare = true,
  emptyHint,
  className,
}: {
  target: AttachmentTarget
  targetId: string
  allowShare?: boolean
  emptyHint?: string
  className?: string
}) {
  const { user, isManager } = useAuth()
  const { list, upload, remove, version, share } = useAttachments(target, targetId)
  const input = useRef<HTMLInputElement>(null)
  const versionInput = useRef<HTMLInputElement>(null)
  const [versionFor, setVersionFor] = useState<Attachment | null>(null)
  const [confirm, setConfirm] = useState<Attachment | null>(null)
  const [dragging, setDragging] = useState(false)

  const onFiles = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      await toast
        .promise(upload.mutateAsync(file), {
          loading: `Đang tải ${file.name}…`,
          success: `Đã tải lên ${file.name}`,
          error: (e) => `Không tải được: ${errorMessage(e)}`,
        })
        .unwrap()
        .catch(() => {})
    }
    if (input.current) input.current.value = ''
  }

  const onVersion = (files: FileList | null) => {
    const file = files?.[0]
    const current = versionFor
    if (versionInput.current) versionInput.current.value = ''
    if (!file || !current) return
    toast.promise(version.mutateAsync({ id: current.id, file }), {
      loading: `Đang tải phiên bản mới của ${current.fileName}…`,
      success: (a) => `Đã cập nhật lên v${a.version}`,
      error: (e) => `Không tải được: ${errorMessage(e)}`,
    })
    setVersionFor(null)
  }

  const pickVersion = (a: Attachment) => {
    setVersionFor(a)
    requestAnimationFrame(() => versionInput.current?.click())
  }

  const toggleShare = (a: Attachment, on: boolean) =>
    share.mutate(
      { id: a.id, sharedWithClient: on },
      {
        onSuccess: () => toast.success(on ? 'Đã chia sẻ với khách hàng' : 'Đã ngừng chia sẻ với khách hàng'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  const drop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    onFiles(e.dataTransfer.files)
  }

  const items = list.data ?? []

  return (
    <div
      className={cn('space-y-2', className)}
      onDragOver={(e) => {
        e.preventDefault()
        if (!dragging) setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={drop}
    >
      {list.isLoading &&
        [0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="size-11 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}

      {items.map((a) => {
        const canEdit = a.uploaderId === user?.id || isManager
        const canShare = allowShare && canEdit && target !== 'DISCUSSION'
        return (
          <div
            key={a.id}
            className="group hover:border-border-strong hover:bg-subtle/60 flex items-center gap-3 rounded-lg border p-3 transition-colors"
          >
            <FileTag fileName={a.fileName} mimeType={a.mimeType} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <a
                  href={attachmentUrl(a.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-semibold hover:underline focus-visible:underline focus-visible:outline-none"
                  title={a.fileName}
                >
                  {a.fileName}
                </a>
                {a.version > 1 && <VersionBadge attachment={a} />}
                {a.sharedWithClient && (
                  <span className="bg-on-time text-on-time-foreground inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] font-semibold">
                    <Users className="size-3" aria-hidden />
                    <span className="hidden sm:inline">Khách hàng xem được</span>
                    <span className="sm:hidden">KH</span>
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 truncate text-[13px]">
                {fileSize(a.size)}, {a.uploader.name}, {fmtDate(a.createdAt, 'dd/MM')}
              </p>
            </div>

            {canShare && (
              <label className="text-muted-foreground hidden cursor-pointer items-center gap-2 text-xs font-medium lg:flex">
                <Switch
                  size="sm"
                  checked={a.sharedWithClient}
                  onCheckedChange={(v) => toggleShare(a, v)}
                  aria-label="Chia sẻ với khách hàng"
                />
                Chia sẻ KH
              </label>
            )}

            <Button variant="ghost" size="sm" className="text-primary hidden font-semibold sm:inline-flex" asChild>
              <a href={attachmentUrl(a.id)} target="_blank" rel="noreferrer">
                Xem
              </a>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" asChild>
                  <a href={attachmentUrl(a.id, true)} aria-label={`Tải về ${a.fileName}`}>
                    <Download className="size-4" strokeWidth={1.8} />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tải về</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Thao tác với tệp">
                  <MoreHorizontal className="size-4" strokeWidth={1.8} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="sm:hidden">
                  <a href={attachmentUrl(a.id)} target="_blank" rel="noreferrer">
                    <Eye /> Xem
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => pickVersion(a)}>
                  <Upload /> Tải phiên bản mới
                </DropdownMenuItem>
                {canShare && (
                  <DropdownMenuCheckboxItem checked={a.sharedWithClient} onCheckedChange={(v) => toggleShare(a, !!v)}>
                    <Share2 className="text-muted-foreground size-4" /> Chia sẻ với khách hàng
                  </DropdownMenuCheckboxItem>
                )}
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(a)}>
                      <Trash2 /> Xoá tệp
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}

      {!list.isLoading && !items.length && emptyHint && (
        <p className="text-muted-foreground py-1 text-sm">{emptyHint}</p>
      )}

      <input ref={input} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <input ref={versionInput} type="file" hidden onChange={(e) => onVersion(e.target.files)} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          'text-text-secondary hover:border-primary/50 hover:bg-primary-soft/40 focus-visible:ring-ring/50 flex w-full cursor-pointer flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border-2 border-dashed px-4 py-5 text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
          dragging && 'border-primary bg-primary-soft/60 text-primary',
        )}
      >
        {upload.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <UploadCloud className="size-4" strokeWidth={1.8} aria-hidden />
        )}
        {dragging ? 'Thả tệp để tải lên' : 'Kéo thả bản vẽ, tài liệu vào đây hoặc'}
        {!dragging && <span className="text-primary font-semibold">Chọn tệp</span>}
      </button>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tệp này?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirm?.fileName}” (v{confirm?.version}) sẽ bị xoá vĩnh viễn.
              {confirm && confirm.version > 1 && ' Phiên bản trước đó sẽ trở thành bản hiện hành.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                confirm &&
                remove.mutate(confirm.id, {
                  onSuccess: () => toast.success('Đã xoá tệp'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Xoá tệp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Nhãn "v2" mở lịch sử phiên bản
function VersionBadge({ attachment }: { attachment: Attachment }) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useAttachmentVersions(attachment.id, open)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="bg-primary-soft text-primary hover:ring-primary/30 inline-flex h-5 shrink-0 cursor-pointer items-center gap-1 rounded px-1.5 text-[11px] font-bold transition-shadow hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Phiên bản ${attachment.version}, xem lịch sử`}
        >
          <History className="size-3" aria-hidden />v{attachment.version}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Lịch sử phiên bản</p>
          <p className="text-muted-foreground truncate text-xs">{attachment.fileName}</p>
        </div>
        <ol className="max-h-72 overflow-y-auto p-2">
          {isLoading &&
            [0, 1].map((i) => <Skeleton key={i} className="m-2 h-10" />)}
          {data?.map((v) => (
            <li key={v.id} className="hover:bg-subtle flex items-center gap-3 rounded-md px-2 py-2">
              <span
                className={cn(
                  'grid h-6 min-w-8 place-items-center rounded px-1 text-[11px] font-bold',
                  v.isLatest ? 'bg-primary text-primary-foreground' : 'bg-subtle text-text-secondary',
                )}
              >
                v{v.version}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{v.fileName}</p>
                <p className="text-muted-foreground text-xs">
                  {v.uploader.name} · {fmtDateTime(v.createdAt)} · {fileSize(v.size)}
                </p>
              </div>
              <Button variant="ghost" size="icon-xs" asChild>
                <a href={attachmentUrl(v.id, true)} aria-label={`Tải về phiên bản ${v.version}`}>
                  <Download />
                </a>
              </Button>
            </li>
          ))}
        </ol>
      </PopoverContent>
    </Popover>
  )
}
