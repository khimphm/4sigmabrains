import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { drawingFileUrl } from './drawing-api'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export interface PageSize {
  width: number
  height: number
}

export type DrawingSource =
  | { kind: 'pdf'; doc: PDFDocumentProxy; sizes: PageSize[] }
  | { kind: 'image'; url: string; sizes: PageSize[] }

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; source: DrawingSource }

// Ảnh quá nhỏ vẫn hiển thị ở khổ dễ nhìn: "100%" = cạnh dài tối thiểu 800px
const MIN_IMAGE_SIDE = 800

// Tải file bản vẽ (PDF hoặc ảnh) kèm cookie phiên, đo kích thước từng trang.
export function useDrawingSource(id: string | undefined, mimeType: string | undefined, reloadKey = 0): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!id || !mimeType) return
    let cancelled = false
    let objectUrl: string | null = null
    let doc: PDFDocumentProxy | null = null
    setState({ status: 'loading' })
    ;(async () => {
      try {
        const res = await fetch(drawingFileUrl(id), { credentials: 'include' })
        if (!res.ok) throw new Error(res.status === 404 ? 'Không tìm thấy file bản vẽ' : `Không tải được file (${res.status})`)
        if (mimeType === 'application/pdf') {
          const data = new Uint8Array(await res.arrayBuffer())
          doc = await pdfjs.getDocument({ data }).promise
          const sizes: PageSize[] = []
          for (let i = 1; i <= doc.numPages; i++) {
            const vp = (await doc.getPage(i)).getViewport({ scale: 1 })
            sizes.push({ width: vp.width, height: vp.height })
          }
          if (!cancelled) setState({ status: 'ready', source: { kind: 'pdf', doc, sizes } })
        } else {
          objectUrl = URL.createObjectURL(await res.blob())
          const img = new Image()
          img.src = objectUrl
          await img.decode()
          const w = img.naturalWidth || 1
          const h = img.naturalHeight || 1
          const k = Math.max(1, MIN_IMAGE_SIDE / Math.max(w, h))
          if (!cancelled)
            setState({ status: 'ready', source: { kind: 'image', url: objectUrl, sizes: [{ width: w * k, height: h * k }] } })
        }
      } catch (e) {
        if (!cancelled)
          setState({
            status: 'error',
            message: e instanceof Error && e.message ? e.message : 'File bản vẽ bị lỗi hoặc không đọc được',
          })
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      void doc?.destroy()
    }
  }, [id, mimeType, reloadKey])

  return state
}

// Vẽ một trang lên <canvas> (PDF) hoặc <img>; luôn phủ kín khối cha.
export function DrawingPageView({
  source,
  page,
  scale,
  className,
}: {
  source: DrawingSource
  page: number
  /** Độ phân giải vẽ PDF (pixel trên 1 điểm PDF) */
  scale: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (source.kind !== 'pdf') return
    let task: RenderTask | null = null
    let cancelled = false
    ;(async () => {
      const p = await source.doc.getPage(page)
      if (cancelled || !canvasRef.current) return
      const viewport = p.getViewport({ scale })
      // Vẽ ra canvas phụ rồi mới chép sang, tránh nháy trắng khi đổi độ phân giải
      const off = document.createElement('canvas')
      off.width = Math.ceil(viewport.width)
      off.height = Math.ceil(viewport.height)
      task = p.render({ canvas: off, canvasContext: off.getContext('2d')!, viewport })
      try {
        await task.promise
      } catch {
        return
      }
      const c = canvasRef.current
      if (cancelled || !c) return
      c.width = off.width
      c.height = off.height
      c.getContext('2d')!.drawImage(off, 0, 0)
      setRendered(true)
    })()
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [source, page, scale])

  if (source.kind === 'image')
    return <img src={source.url} alt="" draggable={false} className={cn('block size-full select-none', className)} />
  return (
    <canvas
      ref={canvasRef}
      className={cn('block size-full transition-opacity duration-200', rendered ? 'opacity-100' : 'opacity-0', className)}
    />
  )
}
