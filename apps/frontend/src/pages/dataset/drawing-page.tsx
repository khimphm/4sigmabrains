import { ArrowRight, CheckCircle2, FileWarning, Info, RefreshCw, RotateCcw, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/features/auth/use-auth'
import {
  DRAWING_STATUS_META,
  EDITABLE_STATUSES,
  drawingFileUrl,
  useCreateAnnotation,
  useDeleteAnnotation,
  useDrawing,
  useDrawingLabels,
  useSyncPageCount,
  useUpdateAnnotation,
  type AnnotationGeometry,
  type AnnotationPatch,
  type DrawingAnnotation,
} from '@/features/dataset/drawing-api'
import { DrawingCanvas, type CanvasTool, type DrawingCanvasHandle } from '@/features/dataset/drawing-canvas'
import { ReviewDialog, SubmitDialog } from '@/features/dataset/drawing-dialogs'
import { useDrawingSource } from '@/features/dataset/drawing-source'
import {
  AnnotationList,
  BatchSiblings,
  DrawingInfo,
  LabelPalette,
  PageThumbnails,
  PanelCard,
  type ReviewMark,
} from '@/features/dataset/drawing-panels'
import { errorMessage } from '@/lib/api'
import { fmtDateTime } from '@/lib/format'

type UndoEntry =
  | { kind: 'create'; id: string }
  | { kind: 'update'; id: string; before: AnnotationPatch }
  | { kind: 'delete'; snapshot: DrawingAnnotation }

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || !!t.closest('[role="dialog"],[role="listbox"],[role="menu"]'))

export function DrawingPage() {
  const { id } = useParams<{ id: string }>()
  // key: đổi bản vẽ thì reset toàn bộ trạng thái xem / chọn / hoàn tác
  return <DrawingWorkspace key={id} id={id} />
}

function DrawingWorkspace({ id }: { id: string | undefined }) {
  const { user, isManager } = useAuth()
  const { data: drawing, isLoading, error, refetch } = useDrawing(id)
  const { data: labels = [], isLoading: labelsLoading } = useDrawingLabels()
  const [reloadKey, setReloadKey] = useState(0)
  const load = useDrawingSource(drawing?.id, drawing?.mimeType, reloadKey)
  const compact = useMediaQuery('(max-width: 1023px)')

  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [toolChoice, setTool] = useState<CanvasTool>('select')
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<string, ReviewMark>>({})
  const [submitOpen, setSubmitOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const canvasRef = useRef<DrawingCanvasHandle>(null)

  const createAnn = useCreateAnnotation(id ?? '')
  const updateAnn = useUpdateAnnotation(id ?? '')
  const deleteAnn = useDeleteAnnotation(id ?? '')
  const syncPages = useSyncPageCount(id ?? '')

  const annotations = useMemo(() => drawing?.annotations ?? [], [drawing])
  const numbers = useMemo(() => new Map(annotations.map((a, i) => [a.id, i + 1])), [annotations])
  const numberOf = useCallback((aid: string) => numbers.get(aid) ?? 0, [numbers])
  const source = load.status === 'ready' ? load.source : null
  const pageCount = source?.sizes.length ?? drawing?.pageCount ?? 1
  const countByPage = useMemo(() => {
    const m = new Map<number, number>()
    for (const a of annotations) m.set(a.page, (m.get(a.page) ?? 0) + 1)
    return m
  }, [annotations])

  // Backend mặc định pageCount = 1; cập nhật theo số trang PDF thực tế
  const synced = useRef<string | null>(null)
  useEffect(() => {
    if (!drawing || !source || source.kind !== 'pdf' || synced.current === drawing.id) return
    synced.current = drawing.id
    if (source.sizes.length !== drawing.pageCount) syncPages.mutate(source.sizes.length)
  }, [drawing, source, syncPages])

  const activeLabel = labels.find((l) => l.id === activeLabelId) ?? labels[0] ?? null
  const statusEditable = !!drawing && EDITABLE_STATUSES.includes(drawing.status)
  const editable = statusEditable && !compact
  const canReview =
    !!drawing &&
    !!user &&
    drawing.status === 'IN_REVIEW' &&
    drawing.labelerId !== user.id &&
    (!drawing.reviewerId || drawing.reviewerId === user.id || isManager)
  const canDelete = useCallback((a: DrawingAnnotation) => a.authorId === user?.id || isManager, [user, isManager])

  const tool: CanvasTool = !editable && toolChoice === 'box' ? 'select' : toolChoice

  const undoRef = useRef<() => Promise<void> | void>(() => {})
  const pushUndo = (e: UndoEntry) => setUndoStack((s) => [...s.slice(-29), e])

  const handleCreate = async (g: AnnotationGeometry) => {
    if (!activeLabel) {
      toast.error('Chưa có nhãn lỗi để gán')
      return
    }
    try {
      const a = await createAnn.mutateAsync({ ...g, page, labelTypeId: activeLabel.id })
      setSelectedId(a.id)
      pushUndo({ kind: 'create', id: a.id })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const handlePatch = useCallback(
    (aid: string, patch: AnnotationPatch, opts?: { silentUndo?: boolean }) => {
      const a = annotations.find((x) => x.id === aid)
      if (!a) return
      const before: AnnotationPatch = {}
      for (const k of Object.keys(patch) as (keyof AnnotationPatch)[]) (before as Record<string, unknown>)[k] = a[k]
      updateAnn.mutate({ id: aid, ...patch }, { onError: (e) => toast.error(errorMessage(e)) })
      if (!opts?.silentUndo) pushUndo({ kind: 'update', id: aid, before })
    },
    [annotations, updateAnn],
  )

  const handleDelete = useCallback(
    (aid: string) => {
      const a = annotations.find((x) => x.id === aid)
      if (!a) return
      if (!canDelete(a)) {
        toast.error('Chỉ người tạo hoặc quản lý mới xoá được vùng này')
        return
      }
      deleteAnn.mutate(aid, { onError: (e) => toast.error(errorMessage(e)) })
      if (selectedId === aid) setSelectedId(null)
      pushUndo({ kind: 'delete', snapshot: a })
      toast(`Đã xoá vùng #${numberOf(aid)}`, {
        description: a.labelType.name,
        action: { label: 'Hoàn tác', onClick: () => void undoRef.current() },
      })
    },
    [annotations, canDelete, deleteAnn, selectedId, numberOf],
  )

  const undo = useCallback(async () => {
    const last = undoStack[undoStack.length - 1]
    if (!last || !editable) return
    setUndoStack((s) => s.slice(0, -1))
    try {
      if (last.kind === 'create') {
        await deleteAnn.mutateAsync(last.id)
        if (selectedId === last.id) setSelectedId(null)
      } else if (last.kind === 'update') {
        await updateAnn.mutateAsync({ id: last.id, ...last.before })
      } else {
        const s = last.snapshot
        const a = await createAnn.mutateAsync({
          labelTypeId: s.labelTypeId,
          page: s.page,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          note: s.note ?? undefined,
        })
        setSelectedId(a.id)
      }
      toast.success('Đã hoàn tác')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }, [undoStack, editable, deleteAnn, updateAnn, createAnn, selectedId])
  useEffect(() => {
    undoRef.current = undo
  }, [undo])

  const focusAnnotation = useCallback((a: DrawingAnnotation) => {
    setSelectedId(a.id)
    canvasRef.current?.focusAnnotation(a)
  }, [])

  const setMark = useCallback((aid: string, m: ReviewMark | null) => {
    setMarks((prev) => {
      const next = { ...prev }
      if (m) next[aid] = m
      else delete next[aid]
      return next
    })
  }, [])

  const pickLabel = useCallback(
    (lid: string) => {
      setActiveLabelId(lid)
      if (editable && selectedId) {
        const a = annotations.find((x) => x.id === selectedId)
        if (a && a.labelTypeId !== lid) handlePatch(selectedId, { labelTypeId: lid })
      }
    },
    [editable, selectedId, annotations, handlePatch],
  )

  // Phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.altKey) return
      const mod = e.ctrlKey || e.metaKey
      const sel = annotations.find((a) => a.id === selectedId)
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        void undo()
        return
      }
      if (mod) return
      const k = e.key
      if (e.shiftKey && e.code === 'Digit1') {
        canvasRef.current?.actualSize()
        return
      }
      if (/^[1-9]$/.test(k) && !e.shiftKey) {
        const l = labels[Number(k) - 1]
        if (l && statusEditable) pickLabel(l.id)
        return
      }
      switch (k.toLowerCase()) {
        case 'v':
          setTool('select')
          return
        case 'b':
        case 'r':
          if (editable) setTool('box')
          return
        case 'h':
          setTool('hand')
          return
        case '+':
        case '=':
          canvasRef.current?.zoomIn()
          return
        case '-':
        case '_':
          canvasRef.current?.zoomOut()
          return
        case '0':
          canvasRef.current?.fit()
          return
        case '[':
          setPage((p) => Math.max(1, p - 1))
          return
        case ']':
          setPage((p) => Math.min(pageCount, p + 1))
          return
        case 'escape':
          setSelectedId(null)
          return
        case 'a':
          if (canReview && sel) setMark(sel.id, { status: 'APPROVED', note: '' })
          return
        case 'x':
          if (canReview && sel) setMark(sel.id, { status: 'REJECTED', note: marks[sel.id]?.note ?? '' })
          return
        case 'delete':
        case 'backspace':
          if (editable && sel) {
            e.preventDefault()
            handleDelete(sel.id)
          }
          return
      }
      if (k.startsWith('Arrow') && editable && sel) {
        e.preventDefault()
        const step = e.shiftKey ? 0.01 : 0.002
        const dx = k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0
        const dy = k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0
        handlePatch(sel.id, {
          x: Math.min(1 - sel.width, Math.max(0, sel.x + dx)),
          y: Math.min(1 - sel.height, Math.max(0, sel.y + dy)),
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [annotations, selectedId, labels, editable, statusEditable, canReview, marks, pageCount, undo, pickLabel, handleDelete, handlePatch, setMark])

  if (isLoading) return <DrawingSkeleton />
  if (error || !drawing)
    return (
      <div className="p-4 md:p-8">
        <PageTopbar crumbs={[{ label: 'Dataset bản vẽ', to: '/dataset' }, { label: 'Không tìm thấy' }]} />
        <EmptyState
          icon={FileWarning}
          title="Không mở được bản vẽ"
          description={error ? errorMessage(error) : 'Bản vẽ không tồn tại hoặc đã bị xoá.'}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw /> Thử lại
              </Button>
              <Button asChild>
                <Link to="/dataset">Về Dataset bản vẽ</Link>
              </Button>
            </div>
          }
        />
      </div>
    )

  const status = DRAWING_STATUS_META[drawing.status]
  const readOnlyNote = canReview
    ? 'Chế độ duyệt: đánh giá Đạt / Không đạt cho từng vùng'
    : drawing.status === 'IN_REVIEW'
      ? 'Đang chờ duyệt, chỉ xem'
      : drawing.status === 'APPROVED'
        ? 'Đã duyệt, chỉ xem'
        : compact && statusEditable
          ? 'Màn hình nhỏ: chỉ xem. Mở trên máy tính để khoanh vùng'
          : null
  const reviewMarkStatus = Object.fromEntries(Object.entries(marks).map(([k, m]) => [k, m.status]))

  const actions = (
    <div className="flex items-center gap-2">
      {drawing.nextId && (
        <Button variant="outline" asChild className="hidden sm:inline-flex">
          <Link to={`/dataset/drawings/${drawing.nextId}`}>
            Bản vẽ tiếp <ArrowRight />
          </Link>
        </Button>
      )}
      {statusEditable && (
        <Button onClick={() => setSubmitOpen(true)} disabled={!annotations.length}>
          <Send /> Gửi duyệt
        </Button>
      )}
      {canReview && (
        <Button onClick={() => setReviewOpen(true)}>
          <CheckCircle2 /> Duyệt bản vẽ
        </Button>
      )}
    </div>
  )

  const canvasArea = (
    <div className={compact ? 'h-[62svh] min-h-80' : 'min-h-0 flex-1'}>
      {load.status === 'error' ? (
        <div className="bg-card shadow-card flex h-full flex-col items-center justify-center rounded-[10px] border p-6">
          <EmptyState
            icon={FileWarning}
            title="Không hiển thị được file bản vẽ"
            description={load.message}
            className="w-full max-w-md border-none"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                  <RefreshCw /> Tải lại
                </Button>
                <Button variant="ghost" asChild>
                  <a href={drawingFileUrl(drawing.id)} target="_blank" rel="noreferrer">
                    Mở file gốc
                  </a>
                </Button>
              </div>
            }
          />
        </div>
      ) : !source ? (
        <div className="bg-card shadow-card flex h-full flex-col overflow-hidden rounded-[10px] border">
          <div className="flex h-12 items-center gap-2 border-b px-3">
            {[56, 112, 56, 1, 120].map((w, i) => (
              <Skeleton key={i} className="h-7" style={{ width: w }} />
            ))}
          </div>
          <div className="dark bg-background bg-dots grid flex-1 place-items-center">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-64 w-48 bg-white/10" />
              <span className="text-muted-foreground text-xs">Đang tải bản vẽ…</span>
            </div>
          </div>
        </div>
      ) : (
        <DrawingCanvas
          key={drawing.id}
          ref={canvasRef}
          source={source}
          page={Math.min(page, pageCount)}
          pageCount={pageCount}
          onPageChange={(p) => setPage(Math.min(Math.max(1, p), pageCount))}
          annotations={annotations}
          numberOf={numberOf}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hoverId={hoverId}
          onHover={setHoverId}
          tool={tool}
          onToolChange={setTool}
          editable={editable}
          activeLabel={activeLabel}
          onCreate={handleCreate}
          onUpdate={(aid, g) => handlePatch(aid, g)}
          canUndo={undoStack.length > 0}
          onUndo={() => void undo()}
          readOnlyNote={readOnlyNote}
          reviewMarks={canReview ? reviewMarkStatus : undefined}
        />
      )}
    </div>
  )

  const list = (
    <AnnotationList
      annotations={annotations}
      numberOf={numberOf}
      labels={labels}
      selectedId={selectedId}
      hoverId={hoverId}
      onHover={setHoverId}
      onFocus={focusAnnotation}
      editable={statusEditable}
      canDelete={canDelete}
      onUpdate={(aid, p) => handlePatch(aid, p)}
      onDelete={handleDelete}
      reviewing={canReview}
      marks={marks}
      onMark={setMark}
      showPage={pageCount > 1}
    />
  )
  const palette = (
    <LabelPalette
      labels={labels}
      activeId={activeLabel?.id ?? null}
      onPick={pickLabel}
      disabled={!statusEditable}
      loading={labelsLoading}
    />
  )
  const listAside = (
    <span className="text-muted-foreground num text-[13px] font-semibold">
      {canReview ? `${Object.keys(marks).length}/${annotations.length} đã đánh giá` : `${annotations.length} vùng`}
    </span>
  )

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:h-[calc(100svh-3.5rem)] lg:py-5">
      <PageTopbar
        crumbs={[
          { label: 'Dataset bản vẽ', to: '/dataset' },
          { label: drawing.batch.name, to: `/dataset?batch=${drawing.batchId}` },
          { label: drawing.code },
        ]}
        title={`${drawing.code} · Dataset bản vẽ`}
        actions={actions}
      />

      {/* Tiêu đề */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight">{drawing.code}</h1>
          <Pill tone={status.tone}>{status.label}</Pill>
          {drawing.title && <span className="text-text-secondary truncate text-[15px]">{drawing.title}</span>}
        </div>
        <p className="text-muted-foreground text-[13px]">
          {drawing.labeler ? `Gán bởi ${drawing.labeler.name}` : 'Chưa có người gán'}
          {drawing.reviewer && ` · Duyệt: ${drawing.reviewer.name}`}
        </p>
      </div>

      {drawing.status === 'CHANGES_REQUESTED' && (
        <div className="bg-late text-late-foreground flex shrink-0 items-start gap-2.5 rounded-[10px] px-4 py-3 text-sm">
          <RotateCcw className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">
              Cần sửa nhãn
              {drawing.reviewedAt && <span className="font-normal opacity-80"> · {fmtDateTime(drawing.reviewedAt)}</span>}
            </p>
            <p className="mt-0.5">
              {drawing.reviewNote ||
                `${annotations.filter((a) => a.status === 'REJECTED').length} vùng không đạt. Sửa lại rồi gửi duyệt lần nữa.`}
            </p>
          </div>
        </div>
      )}
      {drawing.status === 'APPROVED' && drawing.reviewNote && (
        <div className="bg-on-time text-on-time-foreground flex shrink-0 items-start gap-2.5 rounded-[10px] px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">Nhận xét của người duyệt: </span>
            {drawing.reviewNote}
          </p>
        </div>
      )}

      {compact ? (
        <>
          {canvasArea}
          <Tabs defaultValue="labels">
            <TabsList className="w-full">
              <TabsTrigger value="labels">Nhãn ({annotations.length})</TabsTrigger>
              <TabsTrigger value="palette">Bộ nhãn</TabsTrigger>
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="pages">{pageCount > 1 ? 'Trang' : 'Đợt'}</TabsTrigger>
            </TabsList>
            <TabsContent value="labels">
              <PanelCard title="Nhãn trên bản vẽ này" aside={listAside}>
                {list}
              </PanelCard>
            </TabsContent>
            <TabsContent value="palette">
              <PanelCard title="Bộ nhãn lỗi">{palette}</PanelCard>
            </TabsContent>
            <TabsContent value="info">
              <PanelCard title="Thông tin bản vẽ">
                <DrawingInfo drawing={drawing} pageCount={pageCount} />
              </PanelCard>
            </TabsContent>
            <TabsContent value="pages">
              <div className="bg-card shadow-card space-y-4 rounded-[10px] border p-4">
                {source && pageCount > 1 && (
                  <PageThumbnails
                    source={source}
                    page={page}
                    onPageChange={setPage}
                    countByPage={countByPage}
                    orientation="horizontal"
                  />
                )}
                <BatchSiblings drawing={drawing} />
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[184px_minmax(0,1fr)_340px]">
          <aside
            aria-label="Trang và bản vẽ cùng đợt"
            className="bg-card shadow-card scroll-thin hidden min-h-0 space-y-5 overflow-y-auto rounded-[10px] border p-3 xl:block"
          >
            {source && pageCount > 1 && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Trang <span className="num">({pageCount})</span>
                </h3>
                <PageThumbnails source={source} page={page} onPageChange={setPage} countByPage={countByPage} />
              </div>
            )}
            <BatchSiblings drawing={drawing} />
          </aside>
          <div className="flex min-h-0 min-w-0 flex-col">{canvasArea}</div>
          <aside aria-label="Nhãn và thông tin" className="scroll-thin min-h-0 space-y-4 overflow-y-auto pr-0.5">
            <PanelCard title="Nhãn trên bản vẽ này" aside={listAside}>
              {list}
            </PanelCard>
            <PanelCard title="Bộ nhãn lỗi">{palette}</PanelCard>
            <PanelCard title="Thông tin bản vẽ">
              <DrawingInfo drawing={drawing} pageCount={pageCount} />
            </PanelCard>
          </aside>
        </div>
      )}

      {user && <SubmitDialog key={submitOpen ? 'open' : 'closed'} drawing={drawing} currentUserId={user.id} open={submitOpen} onOpenChange={setSubmitOpen} />}
      {canReview && (
        <ReviewDialog
          drawing={drawing}
          marks={marks}
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          onDone={() => setMarks({})}
        />
      )}
    </div>
  )
}

function DrawingSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:h-[calc(100svh-3.5rem)] lg:py-5" aria-busy="true">
      <PageTopbar crumbs={[{ label: 'Dataset bản vẽ', to: '/dataset' }, { label: 'Đang tải…' }]} />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[184px_minmax(0,1fr)_340px]">
        <Skeleton className="hidden rounded-[10px] xl:block" />
        <Skeleton className="h-[60svh] rounded-[10px] lg:h-auto" />
        <div className="space-y-4">
          <Skeleton className="h-72 rounded-[10px]" />
          <Skeleton className="h-40 rounded-[10px]" />
        </div>
      </div>
    </div>
  )
}
