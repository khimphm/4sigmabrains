import {
  ArrowDownAZ,
  Download,
  Eye,
  FolderOpen,
  History,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Share2,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useProjects } from '@/features/projects/api'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { fileSize, fmtDate, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

import {
  fileUrl,
  useDeleteFile,
  useFileLibrary,
  useShareFile,
  useUploadVersion,
  type LibraryFile,
} from './api'
import { fileKind, KIND_META, KIND_ORDER, type FileKind } from './file-kind'
import { FileSource, FileThumb, ProjectDot } from './file-parts'
import { FilePreviewDialog } from './file-preview-dialog'
import { FileVersionsSheet } from './file-versions-sheet'
import { UploadFilesDialog } from './upload-files-dialog'

type View = 'grid' | 'list'
type Sort = 'recent' | 'name' | 'size'
const ALL = '__all'

const VIEW_KEY = 'files.view'
const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// Thư viện "Tệp và bản vẽ". Có projectId thì cố định theo dự án (tab trong trang dự án).
export function FileLibrary({ projectId, showUpload = true, uploadOpen, onUploadOpenChange }: {
  projectId?: string
  showUpload?: boolean
  // Cho phép trang cha mở hộp thoại tải lên (nút chính trên thanh trên cùng)
  uploadOpen?: boolean
  onUploadOpenChange?: (open: boolean) => void
}) {
  const { user, isManager } = useAuth()
  const [params, setParams] = useSearchParams()
  const projects = useProjects()
  const users = useUsers()

  const [q, setQ] = useState('')
  const [kind, setKind] = useState<FileKind | 'all'>('all')
  const [shared, setShared] = useState(false)
  const [uploaderId, setUploaderId] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [view, setViewState] = useState<View>(readView)
  const urlProject = params.get('projectId') ?? ''
  const project = projectId ?? urlProject

  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* bỏ qua */
    }
  }
  const setProject = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('projectId', id)
    else next.delete('projectId')
    setParams(next, { replace: true })
  }

  const debouncedQ = useDebounced(q)
  const library = useFileLibrary({ projectId: project || undefined, q: debouncedQ, shared, uploaderId: uploaderId || undefined })

  const [innerUpload, setInnerUpload] = useState(false)
  const uploadIsOpen = uploadOpen ?? innerUpload
  const setUploadOpen = onUploadOpenChange ?? setInnerUpload

  const [preview, setPreview] = useState<LibraryFile | null>(null)
  const [history, setHistory] = useState<LibraryFile | null>(null)
  const [deleting, setDeleting] = useState<LibraryFile | null>(null)
  const versionInput = useRef<HTMLInputElement>(null)
  const versionTarget = useRef<LibraryFile | null>(null)

  const share = useShareFile()
  const remove = useDeleteFile()
  const uploadVersion = useUploadVersion()

  const all = useMemo(() => library.data ?? [], [library.data])
  const counts = useMemo(() => {
    const c: Record<FileKind, number> = { pdf: 0, image: 0, cad: 0, sheet: 0, doc: 0, other: 0 }
    for (const f of all) c[fileKind(f.fileName, f.mimeType)]++
    return c
  }, [all])
  const files = useMemo(() => {
    const list = kind === 'all' ? [...all] : all.filter((f) => fileKind(f.fileName, f.mimeType) === kind)
    if (sort === 'name') list.sort((a, b) => a.fileName.localeCompare(b.fileName, 'vi'))
    if (sort === 'size') list.sort((a, b) => b.size - a.size)
    return list
  }, [all, kind, sort])

  const filtered = !!(q || shared || uploaderId || kind !== 'all' || (!projectId && urlProject))
  const clearFilters = () => {
    setQ('')
    setKind('all')
    setShared(false)
    setUploaderId('')
    if (!projectId) setProject('')
  }

  const canShare = (f: LibraryFile) => isManager || f.uploader.id === user?.id
  const canDelete = canShare

  const toggleShare = (f: LibraryFile, value: boolean) =>
    share.mutate(
      { id: f.id, shared: value },
      {
        onSuccess: () => toast.success(value ? 'Đã chia sẻ với khách hàng' : 'Đã ngừng chia sẻ với khách hàng'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  const startVersionUpload = (f: LibraryFile) => {
    versionTarget.current = f
    versionInput.current?.click()
  }

  const actions = {
    preview: setPreview,
    history: setHistory,
    newVersion: startVersionUpload,
    share: toggleShare,
    remove: setDeleting,
    canShare,
    canDelete,
  }

  return (
    <div className="space-y-4">
      {/* Thanh công cụ */}
      <div className="bg-card shadow-card space-y-3 rounded-[10px] border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên tệp…"
              aria-label="Tìm tệp"
              className="pl-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Xoá từ khoá"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {!projectId && (
            <Select value={urlProject || ALL} onValueChange={(v) => setProject(v === ALL ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Lọc theo dự án">
                <SelectValue placeholder="Tất cả dự án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả dự án</SelectItem>
                {projects.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={uploaderId || ALL} onValueChange={(v) => setUploaderId(v === ALL ? '' : v)}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-44" aria-label="Lọc theo người tải lên">
              <Users className="size-4" strokeWidth={1.8} aria-hidden />
              <SelectValue placeholder="Người tải lên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Mọi người tải lên</SelectItem>
              {users.data?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-40" aria-label="Sắp xếp">
              <ArrowDownAZ className="size-4" strokeWidth={1.8} aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mới nhất</SelectItem>
              <SelectItem value="name">Tên A–Z</SelectItem>
              <SelectItem value="size">Dung lượng lớn</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            aria-pressed={shared}
            onClick={() => setShared((s) => !s)}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors duration-150',
              'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
              shared ? 'border-primary/40 bg-primary-soft text-primary' : 'border-border-strong bg-card hover:bg-subtle',
            )}
          >
            <Share2 className="size-4" strokeWidth={1.8} aria-hidden />
            Chia sẻ với khách hàng
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="bg-subtle inline-flex rounded-md border p-0.5" role="group" aria-label="Kiểu hiển thị">
              {(
                [
                  ['grid', LayoutGrid, 'Dạng lưới'],
                  ['list', List, 'Dạng danh sách'],
                ] as const
              ).map(([v, Icon, label]) => (
                <Tooltip key={v}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={label}
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={cn(
                        'grid size-8 cursor-pointer place-items-center rounded transition-all duration-150',
                        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                        view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.8} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            {showUpload && (
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <Upload strokeWidth={1.8} />
                Tải lên
              </Button>
            )}
          </div>
        </div>
        {/* Chip loại tệp */}
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Loại tệp">
          <KindChip active={kind === 'all'} onClick={() => setKind('all')} label="Tất cả" count={all.length} />
          {KIND_ORDER.map((k) => (
            <KindChip
              key={k}
              active={kind === k}
              onClick={() => setKind(k)}
              label={KIND_META[k].label}
              count={counts[k]}
              icon={KIND_META[k].icon}
            />
          ))}
        </div>
      </div>

      {library.isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bg-card overflow-hidden rounded-[10px] border">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card space-y-px overflow-hidden rounded-[10px] border">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="size-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : library.isError ? (
        <EmptyState
          icon={FolderOpen}
          title="Không tải được thư viện tệp"
          description={errorMessage(library.error)}
          action={<Button variant="outline" onClick={() => library.refetch()}>Thử lại</Button>}
        />
      ) : files.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Search}
            title="Không có tệp phù hợp"
            description="Thử đổi từ khoá hoặc bỏ bớt bộ lọc."
            action={<Button variant="outline" onClick={clearFilters}>Xoá bộ lọc</Button>}
          />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="Chưa có tệp nào"
            description="Tải bản vẽ, hồ sơ và bảng tính lên để cả nhóm cùng dùng chung một nơi."
            action={
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <Upload strokeWidth={1.8} />
                Tải tệp lên
              </Button>
            }
          />
        )
      ) : view === 'grid' ? (
        <div
          className={cn(
            'grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4',
            library.isFetching && 'opacity-70',
          )}
        >
          {files.map((f) => (
            <FileCard key={f.id} file={f} actions={actions} />
          ))}
        </div>
      ) : (
        <FileTable files={files} actions={actions} showProject={!projectId} fetching={library.isFetching} />
      )}

      {!library.isLoading && files.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Hiển thị {files.length} / {all.length} tệp · {fileSize(files.reduce((s, f) => s + f.size, 0))}
        </p>
      )}

      <input
        ref={versionInput}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          const target = versionTarget.current
          e.target.value = ''
          if (!file || !target) return
          const id = toast.loading(`Đang tải phiên bản mới của ${target.fileName}…`)
          uploadVersion.mutate(
            { id: target.id, file },
            {
              onSuccess: (saved) => {
                toast.success(`Đã lưu phiên bản ${saved.version}`, { id })
                if (history?.id === target.id) setHistory(null)
              },
              onError: (err) => toast.error(errorMessage(err), { id }),
            },
          )
        }}
      />

      <UploadFilesDialog
        open={uploadIsOpen}
        onOpenChange={setUploadOpen}
        projectId={projectId}
        defaultProjectId={urlProject || undefined}
        key={urlProject}
      />
      <FilePreviewDialog file={preview} onOpenChange={(o) => !o && setPreview(null)} />
      <FileVersionsSheet file={history} onOpenChange={(o) => !o && setHistory(null)} onUploadVersion={startVersionUpload} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tệp này?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.fileName}” (phiên bản {deleting?.version}) sẽ bị xoá vĩnh viễn.
              {deleting && deleting.version > 1 && ' Phiên bản trước đó sẽ trở thành bản hiện hành.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                const f = deleting
                if (!f) return
                remove.mutate(f.id, {
                  onSuccess: () => toast.success('Đã xoá tệp'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }}
            >
              Xoá tệp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KindChip({ active, onClick, label, count, icon: Icon }: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  icon?: (typeof KIND_META)[FileKind]['icon']
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-all duration-150',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-text-secondary hover:border-border-strong hover:text-foreground bg-card',
      )}
    >
      {Icon && <Icon className="size-3.5" strokeWidth={1.8} aria-hidden />}
      {label}
      <span
        className={cn(
          'num min-w-5 rounded-full px-1.5 text-center text-[11px]',
          active ? 'bg-background/20' : 'bg-subtle text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  )
}

interface Actions {
  preview: (f: LibraryFile) => void
  history: (f: LibraryFile) => void
  newVersion: (f: LibraryFile) => void
  share: (f: LibraryFile, v: boolean) => void
  remove: (f: LibraryFile) => void
  canShare: (f: LibraryFile) => boolean
  canDelete: (f: LibraryFile) => boolean
}

function FileMenu({ file, actions, className }: { file: LibraryFile; actions: Actions; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Thao tác với ${file.fileName}`}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => actions.preview(file)}>
          <Eye strokeWidth={1.8} />
          Xem trước
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={fileUrl(file.id, true)} download>
            <Download strokeWidth={1.8} />
            Tải xuống
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.newVersion(file)}>
          <Upload strokeWidth={1.8} />
          Tải phiên bản mới
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.history(file)}>
          <History strokeWidth={1.8} />
          Lịch sử phiên bản
        </DropdownMenuItem>
        {actions.canShare(file) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={file.sharedWithClient} onCheckedChange={(v) => actions.share(file, v === true)}>
              Chia sẻ với khách hàng
            </DropdownMenuCheckboxItem>
          </>
        )}
        {actions.canDelete(file) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => actions.remove(file)}>
              <Trash2 strokeWidth={1.8} />
              Xoá
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SharedBadge() {
  return (
    <Pill tone="on-time" icon={Share2} title="Khách hàng xem được tệp này" className="h-5 px-1.5 text-[11px] shadow-sm">
      Đã chia sẻ
    </Pill>
  )
}

function FileCard({ file, actions }: { file: LibraryFile; actions: Actions }) {
  const kind = fileKind(file.fileName, file.mimeType)
  return (
    <article
      className="group bg-card shadow-card hover:border-border-strong relative flex flex-col overflow-hidden rounded-[10px] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop motion-reduce:hover:translate-y-0"
    >
      <button
        type="button"
        onClick={() => actions.preview(file)}
        className="focus-visible:ring-ring/50 relative block cursor-pointer border-b outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
        aria-label={`Xem trước ${file.fileName}`}
      >
        <FileThumb file={file} />
        <span className="absolute top-2 left-2 flex items-center gap-1">
          <span className="bg-card/90 text-foreground rounded px-1.5 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur">
            v{file.version}
          </span>
          {file.sharedWithClient && <SharedBadge />}
        </span>
      </button>
      <FileMenu
        file={file}
        actions={actions}
        className="bg-card/90 absolute top-1.5 right-1.5 shadow-sm backdrop-blur transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 data-[state=open]:opacity-100"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold break-words" title={file.fileName}>
          {file.fileName}
        </h3>
        <p className="text-muted-foreground text-xs">
          {KIND_META[kind].label} · {fileSize(file.size)}
        </p>
        <FileSource file={file} />
        <div className="mt-auto flex items-center gap-2 pt-2">
          <UserAvatar user={file.uploader} className="size-5" tooltip />
          <span className="text-text-secondary min-w-0 flex-1 truncate text-xs max-sm:sr-only">{file.uploader.name}</span>
          <span className="flex-1 sm:hidden" aria-hidden />
          <time className="text-muted-foreground num shrink-0 text-xs" title={fmtDateTime(file.createdAt)} dateTime={file.createdAt}>
            {fmtDate(file.createdAt)}
          </time>
        </div>
      </div>
    </article>
  )
}

function FileTable({ files, actions, showProject, fetching }: {
  files: LibraryFile[]
  actions: Actions
  showProject: boolean
  fetching: boolean
}) {
  return (
    <div className={cn('bg-card shadow-card overflow-hidden rounded-[10px] border transition-opacity', fetching && 'opacity-70')}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-muted-foreground bg-subtle border-b text-left text-xs font-semibold">
              <th className="px-4 py-2.5 font-semibold">Tên tệp</th>
              {showProject && <th className="px-3 py-2.5 font-semibold">Dự án</th>}
              <th className="px-3 py-2.5 font-semibold">Phiên bản</th>
              <th className="px-3 py-2.5 text-right font-semibold">Dung lượng</th>
              <th className="px-3 py-2.5 font-semibold">Người tải lên</th>
              <th className="px-3 py-2.5 font-semibold">Ngày</th>
              <th className="px-3 py-2.5 font-semibold">Khách hàng</th>
              <th className="w-12 px-2 py-2.5">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr
                key={f.id}
                onClick={() => actions.preview(f)}
                className="group hover:bg-subtle cursor-pointer border-b transition-colors last:border-0"
              >
                <td className="max-w-[360px] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <FileThumb file={f} size="row" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold" title={f.fileName}>
                        {f.fileName}
                      </p>
                      <FileSource file={f} className="max-w-full" />
                    </div>
                  </div>
                </td>
                {showProject && (
                  <td className="max-w-[180px] px-3 py-2.5">
                    <ProjectDot project={f.project} />
                  </td>
                )}
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.history(f)
                    }}
                    className="bg-subtle hover:bg-primary-soft hover:text-primary inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold transition-colors"
                    aria-label={`Lịch sử phiên bản ${f.fileName}`}
                  >
                    <History className="size-3" aria-hidden />v{f.version}
                  </button>
                </td>
                <td className="num text-text-secondary px-3 py-2.5 text-right text-xs">{fileSize(f.size)}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <UserAvatar user={f.uploader} className="size-6" />
                    <span className="truncate text-xs font-medium">{f.uploader.name}</span>
                  </span>
                </td>
                <td className="num text-text-secondary px-3 py-2.5 text-xs whitespace-nowrap" title={fmtDateTime(f.createdAt)}>
                  {fmtDate(f.createdAt)}
                </td>
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  {actions.canShare(f) ? (
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                      <Switch
                        checked={f.sharedWithClient}
                        onCheckedChange={(v) => actions.share(f, v)}
                        aria-label={`Chia sẻ ${f.fileName} với khách hàng`}
                      />
                      <span className={f.sharedWithClient ? 'text-on-time-foreground font-semibold' : 'text-muted-foreground'}>
                        {f.sharedWithClient ? 'Đã chia sẻ' : 'Nội bộ'}
                      </span>
                    </label>
                  ) : f.sharedWithClient ? (
                    <SharedBadge />
                  ) : (
                    <span className="text-muted-foreground text-xs">Nội bộ</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right">
                  <FileMenu file={f} actions={actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
