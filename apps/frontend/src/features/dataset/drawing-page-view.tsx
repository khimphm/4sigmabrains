import type { RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { DrawingSource } from './drawing-source'

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
