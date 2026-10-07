// Bản legacy kèm polyfill (Map.getOrInsertComputed…) để chạy được trên Chrome/Safari hiện hành
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useEffect, useState } from 'react'

import { drawingFileUrl } from './drawing-api'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

export interface PageSize {
  width: number
  height: number
}

export type DrawingSource =
  | { kind: 'pdf'; doc: PDFDocumentProxy; sizes: PageSize[] }
  | { kind: 'image'; url: string; sizes: PageSize[] }

export type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; source: DrawingSource }

// Ảnh quá nhỏ vẫn hiển thị ở khổ dễ nhìn: "100%" = cạnh dài tối thiểu 800px
const MIN_IMAGE_SIDE = 800

// Tải file bản vẽ (PDF hoặc ảnh) kèm cookie phiên, đo kích thước từng trang.
export function useDrawingSource(id: string | undefined, mimeType: string | undefined, reloadKey = 0): LoadState {
  const key = `${id}|${mimeType}|${reloadKey}`
  const [state, setRaw] = useState<{ key: string; value: LoadState }>({ key: '', value: { status: 'loading' } })

  useEffect(() => {
    if (!id || !mimeType) return
    let cancelled = false
    let objectUrl: string | null = null
    let doc: PDFDocumentProxy | null = null
    const setState = (value: LoadState) => setRaw({ key, value })
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
      void doc?.loadingTask.destroy()
    }
  }, [key, id, mimeType])

  return state.key === key ? state.value : { status: 'loading' }
}

