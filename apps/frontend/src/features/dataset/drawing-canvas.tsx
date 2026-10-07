import {
  ChevronLeft,
  ChevronRight,
  Hand,
  Keyboard,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  SquareDashed,
  Undo2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AnnotationGeometry, DatasetLabel, DrawingAnnotation } from './drawing-api'
import { DrawingPageView } from './drawing-page-view'
import type { DrawingSource } from './drawing-source'

export type CanvasTool = 'select' | 'box' | 'hand'

export interface DrawingCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  actualSize: () => void
  focusAnnotation: (a: DrawingAnnotation) => void
}

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const HANDLE_POS: Record<Handle, string> = {
  nw: 'left-0 top-0 cursor-nwse-resize',
  n: 'left-1/2 top-0 cursor-ns-resize',
  ne: 'left-full top-0 cursor-nesw-resize',
  e: 'left-full top-1/2 cursor-ew-resize',
  se: 'left-full top-full cursor-nwse-resize',
  s: 'left-1/2 top-full cursor-ns-resize',
  sw: 'left-0 top-full cursor-nesw-resize',
  w: 'left-0 top-1/2 cursor-ew-resize',
}

const MIN_ZOOM = 0.05
const MAX_ZOOM = 8
const MIN_BOX = 0.004
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface View {
  zoom: number
  x: number
  y: number
}

type Drag =
  | { mode: 'pan'; sx: number; sy: number; view: View }
  | { mode: 'draw'; ox: number; oy: number; hitId: string | null }
  | { mode: 'move'; id: string; sx: number; sy: number; box: AnnotationGeometry; moved: boolean }
  | { mode: 'resize'; id: string; handle: Handle; box: AnnotationGeometry }

const SHORTCUTS: [string, string][] = [
  ['V', 'Công cụ chọn'],
  ['B / R', 'Khoanh vùng lỗi'],
  ['H / giữ Space', 'Kéo bản vẽ'],
  ['1 – 9', 'Chọn nhãn lỗi (đổi nhãn vùng đang chọn)'],
  ['+ / −', 'Phóng to / thu nhỏ'],
  ['0', 'Vừa khung'],
  ['Shift + 1', 'Cỡ thật 100%'],
  ['Ctrl + cuộn', 'Phóng to tại con trỏ'],
  ['Mũi tên', 'Dịch vùng đang chọn (Shift: nhanh)'],
  ['Delete', 'Xoá vùng đang chọn'],
  ['Ctrl + Z', 'Hoàn tác thao tác vừa rồi'],
  ['[ / ]', 'Trang trước / sau'],
  ['A / X', 'Duyệt: đạt / không đạt'],
  ['Esc', 'Bỏ chọn'],
]

export function ShortcutsPopover({ className }: { className?: string }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Phím tắt" className={className}>
              <Keyboard strokeWidth={1.8} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Phím tắt</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-bold">Phím tắt</div>
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto px-4 py-3">
          {SHORTCUTS.map(([k, label]) => (
            <li key={k} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-text-secondary">{label}</span>
              <kbd className="bg-subtle text-foreground shrink-0 rounded border px-1.5 py-0.5 font-sans text-xs font-semibold">
                {k}
              </kbd>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function ToolButton({
  active,
  onClick,
  icon: Icon,
  label,
  kbd,
  disabled,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Hand
  label: string
  kbd: string
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-pressed={active}
          aria-label={label}
          className={cn(
            'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
            'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
            active ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-subtle hover:text-foreground',
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
          <span className="hidden xl:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="opacity-70">({kbd})</span>
      </TooltipContent>
    </Tooltip>
  )
}

export function DrawingCanvas({
  ref,
  source,
  page,
  pageCount,
  onPageChange,
  annotations,
  numberOf,
  selectedId,
  onSelect,
  hoverId,
  onHover,
  tool,
  onToolChange,
  editable,
  activeLabel,
  onCreate,
  onUpdate,
  canUndo,
  onUndo,
  readOnlyNote,
  reviewMarks,
}: {
  ref?: Ref<DrawingCanvasHandle>
  source: DrawingSource
  page: number
  pageCount: number
  onPageChange: (p: number) => void
  annotations: DrawingAnnotation[]
  numberOf: (id: string) => number
  selectedId: string | null
  onSelect: (id: string | null) => void
  hoverId: string | null
  onHover: (id: string | null) => void
  tool: CanvasTool
  onToolChange: (t: CanvasTool) => void
  editable: boolean
  activeLabel: DatasetLabel | null
  onCreate: (g: AnnotationGeometry) => Promise<unknown>
  onUpdate: (id: string, g: AnnotationGeometry) => void
  canUndo: boolean
  onUndo: () => void
  readOnlyNote?: string | null
  reviewMarks?: Record<string, 'APPROVED' | 'REJECTED' | undefined>
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 })
  const viewRef = useRef(view)
  useLayoutEffect(() => {
    viewRef.current = view
  }, [view])
  const [spaceDown, setSpaceDown] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const [draft, setDraft] = useState<(AnnotationGeometry & { id?: string }) | null>(null)
  const [pendingBox, setPendingBox] = useState<AnnotationGeometry | null>(null)
  const pendingFocus = useRef<DrawingAnnotation | null>(null)

  const size = source.sizes[page - 1] ?? source.sizes[0]
  const pw = size.width
  const ph = size.height

  // Đo khung nhìn
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setVp({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fitView = useCallback((): View => {
    const pad = vp.w < 500 ? 16 : 48
    const zoom = clamp(Math.min((vp.w - pad * 2) / pw, (vp.h - pad * 2) / ph), MIN_ZOOM, MAX_ZOOM)
    return { zoom, x: (vp.w - pw * zoom) / 2, y: (vp.h - ph * zoom) / 2 }
  }, [vp.w, vp.h, pw, ph])

  const focusView = useCallback(
    (a: AnnotationGeometry): View => {
      const zoom = clamp(Math.min((vp.w * 0.5) / (a.width * pw), (vp.h * 0.5) / (a.height * ph), 4), MIN_ZOOM, MAX_ZOOM)
      const cx = (a.x + a.width / 2) * pw * zoom
      const cy = (a.y + a.height / 2) * ph * zoom
      return { zoom, x: vp.w / 2 - cx, y: vp.h / 2 - cy }
    },
    [vp.w, vp.h, pw, ph],
  )

  // Vừa khung khi mở bản vẽ / đổi trang / lần đầu đo được khung
  const fittedFor = useRef('')
  useLayoutEffect(() => {
    if (!vp.w || !vp.h) return
    const key = `${page}:${pw}x${ph}`
    if (fittedFor.current === key) return
    fittedFor.current = key
    const pf = pendingFocus.current
    if (pf && pf.page === page) {
      pendingFocus.current = null
      setView(focusView(pf))
    } else setView(fitView())
  }, [vp.w, vp.h, page, pw, ph, fitView, focusView])

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    const el = viewportRef.current
    const px = cx ?? (el?.clientWidth ?? 0) / 2
    const py = cy ?? (el?.clientHeight ?? 0) / 2
    setView((v) => {
      const nz = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM)
      const k = nz / v.zoom
      return { zoom: nz, x: px - (px - v.x) * k, y: py - (py - v.y) * k }
    })
  }, [])

  const setZoomCentered = useCallback(
    (z: number) => zoomAt(z / viewRef.current.zoom),
    [zoomAt],
  )

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => zoomAt(1.25),
      zoomOut: () => zoomAt(0.8),
      fit: () => setView(fitView()),
      actualSize: () => setZoomCentered(1),
      focusAnnotation: (a) => {
        if (a.page !== page) {
          pendingFocus.current = a
          onPageChange(a.page)
        } else setView(focusView(a))
      },
    }),
    [zoomAt, fitView, setZoomCentered, focusView, page, onPageChange],
  )

  // Ctrl/⌘ + cuộn: phóng to tại con trỏ; cuộn thường: dịch
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top)
      else setView((v) => ({ ...v, x: v.x - (e.shiftKey ? e.deltaY : e.deltaX), y: v.y - (e.shiftKey ? 0 : e.deltaY) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // Giữ Space để kéo
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isField(e.target)) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(false)
    const blur = () => setSpaceDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  const toNorm = (clientX: number, clientY: number) => {
    const r = viewportRef.current!.getBoundingClientRect()
    const v = viewRef.current
    return { x: (clientX - r.left - v.x) / (pw * v.zoom), y: (clientY - r.top - v.y) / (ph * v.zoom) }
  }

  const startDrag = (d: Drag, e: ReactPointerEvent) => {
    dragRef.current = d
    setDrag(d)
    viewportRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button === 2) return
    const target = e.target as HTMLElement
    const handleEl = target.closest<HTMLElement>('[data-handle]')
    const annEl = target.closest<HTMLElement>('[data-ann-id]')
    const annId = annEl?.dataset.annId ?? null
    const panning = tool === 'hand' || spaceDown || e.button === 1 || e.pointerType === 'touch'
    if (panning) {
      if (e.pointerType === 'touch' && annId) onSelect(annId)
      startDrag({ mode: 'pan', sx: e.clientX, sy: e.clientY, view: viewRef.current }, e)
      return
    }
    if (tool === 'box' && editable) {
      const p = toNorm(e.clientX, e.clientY)
      const ox = clamp(p.x, 0, 1)
      const oy = clamp(p.y, 0, 1)
      startDrag({ mode: 'draw', ox, oy, hitId: annId }, e)
      setDraft({ x: ox, y: oy, width: 0, height: 0 })
      return
    }
    // Công cụ chọn
    if (annId) {
      onSelect(annId)
      const a = annotations.find((x) => x.id === annId)
      if (!a || !editable) return
      const box = { x: a.x, y: a.y, width: a.width, height: a.height }
      if (handleEl) startDrag({ mode: 'resize', id: annId, handle: handleEl.dataset.handle as Handle, box }, e)
      else startDrag({ mode: 'move', id: annId, sx: e.clientX, sy: e.clientY, box, moved: false }, e)
      return
    }
    onSelect(null)
    startDrag({ mode: 'pan', sx: e.clientX, sy: e.clientY, view: viewRef.current }, e)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d) return
    if (d.mode === 'pan') {
      setView({ ...d.view, x: d.view.x + e.clientX - d.sx, y: d.view.y + e.clientY - d.sy })
      return
    }
    const p = toNorm(e.clientX, e.clientY)
    if (d.mode === 'draw') {
      const x2 = clamp(p.x, 0, 1)
      const y2 = clamp(p.y, 0, 1)
      setDraft({ x: Math.min(d.ox, x2), y: Math.min(d.oy, y2), width: Math.abs(x2 - d.ox), height: Math.abs(y2 - d.oy) })
    } else if (d.mode === 'move') {
      const v = viewRef.current
      const dx = (e.clientX - d.sx) / (pw * v.zoom)
      const dy = (e.clientY - d.sy) / (ph * v.zoom)
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 3) return
      d.moved = true
      setDraft({
        id: d.id,
        width: d.box.width,
        height: d.box.height,
        x: clamp(d.box.x + dx, 0, 1 - d.box.width),
        y: clamp(d.box.y + dy, 0, 1 - d.box.height),
      })
    } else {
      let { x, y } = d.box
      let x2 = d.box.x + d.box.width
      let y2 = d.box.y + d.box.height
      const px = clamp(p.x, 0, 1)
      const py = clamp(p.y, 0, 1)
      if (d.handle.includes('w')) x = Math.min(px, x2 - MIN_BOX)
      if (d.handle.includes('e')) x2 = Math.max(px, x + MIN_BOX)
      if (d.handle.includes('n')) y = Math.min(py, y2 - MIN_BOX)
      if (d.handle.includes('s')) y2 = Math.max(py, y + MIN_BOX)
      setDraft({ id: d.id, x, y, width: x2 - x, height: y2 - y })
    }
  }

  const onPointerUp = () => {
    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d || d.mode === 'pan') return
    const g = draft
    setDraft(null)
    if (d.mode === 'draw') {
      if (!g || g.width < MIN_BOX * 2 || g.height < MIN_BOX * 2) {
        onSelect(d.hitId)
        return
      }
      const box = { x: g.x, y: g.y, width: g.width, height: g.height }
      setPendingBox(box)
      onCreate(box).finally(() => setPendingBox(null))
      return
    }
    if (g && g.id && (d.mode === 'resize' || d.moved))
      onUpdate(g.id, { x: g.x, y: g.y, width: g.width, height: g.height })
  }

  const pageAnnotations = annotations.filter((a) => a.page === page)
  const cursor =
    drag?.mode === 'pan'
      ? 'cursor-grabbing'
      : tool === 'hand' || spaceDown
        ? 'cursor-grab'
        : tool === 'box' && editable
          ? 'cursor-crosshair'
          : 'cursor-default'
  const renderScale = clamp(Math.ceil(view.zoom * (window.devicePixelRatio || 1) * 2) / 2, 1, 4)
  const zoomPct = Math.round(view.zoom * 100)

  return (
    <div className="bg-card shadow-card flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border">
      {/* Thanh công cụ */}
      <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b px-2 [scrollbar-width:none]">
        <div role="toolbar" aria-label="Công cụ" className="flex items-center gap-0.5">
          <ToolButton active={tool === 'select'} onClick={() => onToolChange('select')} icon={MousePointer2} label="Chọn" kbd="V" />
          <ToolButton
            active={tool === 'box'}
            onClick={() => onToolChange('box')}
            icon={SquareDashed}
            label="Khoanh vùng lỗi"
            kbd="B"
            disabled={!editable}
          />
          <ToolButton active={tool === 'hand'} onClick={() => onToolChange('hand')} icon={Hand} label="Kéo" kbd="H" />
        </div>
        <span className="bg-border mx-1 h-5 w-px shrink-0" />
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label="Thu nhỏ" onClick={() => zoomAt(0.8)}>
            <Minus strokeWidth={1.8} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Mức phóng"
                className="hover:bg-subtle num focus-visible:ring-ring/50 h-8 min-w-14 cursor-pointer rounded-md px-1.5 text-[13px] font-semibold outline-none focus-visible:ring-[3px]"
              >
                {zoomPct}%
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => setView(fitView())}>
                <Maximize /> Vừa khung
              </DropdownMenuItem>
              {[0.5, 1, 2, 4].map((z) => (
                <DropdownMenuItem key={z} onClick={() => setZoomCentered(z)}>
                  <span className="num w-10">{z * 100}%</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon-sm" aria-label="Phóng to" onClick={() => zoomAt(1.25)}>
            <Plus strokeWidth={1.8} />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Vừa khung" onClick={() => setView(fitView())}>
                <Maximize strokeWidth={1.8} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Vừa khung (0)</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {pageCount > 1 && (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Trang trước"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft strokeWidth={1.8} />
              </Button>
              <span className="num text-text-secondary px-1 text-[13px] font-semibold whitespace-nowrap">
                {page}/{pageCount}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Trang sau"
                disabled={page >= pageCount}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight strokeWidth={1.8} />
              </Button>
            </div>
          )}
          {editable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Hoàn tác" disabled={!canUndo} onClick={onUndo}>
                  <Undo2 strokeWidth={1.8} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hoàn tác (Ctrl + Z)</TooltipContent>
            </Tooltip>
          )}
          <ShortcutsPopover className="hidden md:inline-flex" />
        </div>
      </div>

      {/* Khung vẽ: nền tối có chấm (dùng bảng màu tối cho riêng vùng này) */}
      <div
        ref={viewportRef}
        role="application"
        aria-label="Khung bản vẽ"
        // bg-dots để ngoài cn(): tailwind-merge coi nó trùng nhóm với bg-background
        className={`dark bg-background bg-dots relative min-h-0 flex-1 touch-none overflow-hidden select-none ${cursor}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => onHover(null)}
      >
        <div
          className="absolute top-0 left-0 bg-white shadow-[0_8px_40px_rgb(0_0_0/0.5)]"
          style={{ width: pw * view.zoom, height: ph * view.zoom, transform: `translate(${view.x}px, ${view.y}px)` }}
        >
          <DrawingPageView source={source} page={page} scale={renderScale} />
          {pageAnnotations.map((a) => {
            const g = draft?.id === a.id ? draft : a
            const selected = a.id === selectedId
            const hovered = a.id === hoverId
            const mark = reviewMarks?.[a.id] ?? (a.status === 'PENDING' ? undefined : a.status)
            const rejected = mark === 'REJECTED'
            return (
              <div
                key={a.id}
                data-ann-id={a.id}
                onPointerEnter={() => onHover(a.id)}
                onPointerLeave={() => onHover(null)}
                className={cn(
                  'group absolute transition-[background-color,box-shadow] duration-150',
                  tool === 'select' && !spaceDown && (editable ? 'cursor-move' : 'cursor-pointer'),
                  selected
                    ? 'border-annotation bg-annotation/15 z-20 border-2'
                    : 'border-annotation bg-annotation/10 z-10 border-[1.5px] border-dashed',
                  hovered && !selected && 'bg-annotation/25 ring-annotation/40 z-20 ring-4',
                  rejected && !selected && 'opacity-60',
                )}
                style={{
                  left: `${g.x * 100}%`,
                  top: `${g.y * 100}%`,
                  width: `${g.width * 100}%`,
                  height: `${g.height * 100}%`,
                }}
              >
                <span
                  className={cn(
                    'bg-annotation text-sidebar pointer-events-none absolute bottom-full left-[-1.5px] mb-1 flex max-w-60 items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm',
                    rejected && 'line-through',
                    !selected && !hovered && view.zoom < 0.2 && 'max-w-10',
                  )}
                >
                  <span className="num">#{numberOf(a.id)}</span>
                  <span className="truncate">{a.labelType.name}</span>
                  {mark && <span className="sr-only">{mark === 'APPROVED' ? 'Đạt' : 'Không đạt'}</span>}
                </span>
                {selected &&
                  editable &&
                  tool === 'select' &&
                  HANDLES.map((h) => (
                    <span
                      key={h}
                      data-handle={h}
                      className={cn(
                        'border-annotation absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border-2 bg-white',
                        HANDLE_POS[h],
                      )}
                    />
                  ))}
              </div>
            )
          })}
          {(draft && !draft.id ? draft : pendingBox) && (
            <div
              className="border-annotation bg-annotation/20 pointer-events-none absolute z-30 border-2"
              style={{
                left: `${(draft && !draft.id ? draft : pendingBox)!.x * 100}%`,
                top: `${(draft && !draft.id ? draft : pendingBox)!.y * 100}%`,
                width: `${(draft && !draft.id ? draft : pendingBox)!.width * 100}%`,
                height: `${(draft && !draft.id ? draft : pendingBox)!.height * 100}%`,
              }}
            >
              {activeLabel && (
                <span className="bg-annotation text-sidebar absolute bottom-full left-[-2px] mb-1 rounded-[4px] px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                  {pendingBox ? 'Đang lưu…' : activeLabel.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chú thích trạng thái dưới khung */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
          {readOnlyNote ? (
            <span className="bg-card/90 text-text-secondary rounded-md border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
              {readOnlyNote}
            </span>
          ) : tool === 'box' && editable ? (
            <span className="bg-card/90 text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
              <span className="size-2.5 rounded-full" style={{ background: activeLabel?.color }} />
              {activeLabel ? `Kéo để khoanh: ${activeLabel.name}` : 'Chọn một nhãn lỗi trước khi khoanh'}
            </span>
          ) : (
            <span />
          )}
          <span className="bg-card/90 text-muted-foreground num hidden rounded-md border px-2 py-1 text-xs shadow-sm backdrop-blur sm:inline">
            {pageAnnotations.length} vùng trên trang {page}
          </span>
        </div>
      </div>
    </div>
  )
}
