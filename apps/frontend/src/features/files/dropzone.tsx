import { CloudUpload, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { fileSize } from '@/lib/format'
import { cn } from '@/lib/utils'

import { fileKind, KIND_META } from './file-kind'

// Vùng kéo-thả chọn nhiều file, dùng chung cho thư viện tệp và dataset bản vẽ
export function Dropzone({ files, onChange, accept, max, hint, disabled, status }: {
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  max?: number
  hint?: ReactNode
  disabled?: boolean
  // Trạng thái từng file khi đang tải (theo chỉ số)
  status?: Record<number, 'pending' | 'uploading' | 'done' | 'error'>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const add = (list: FileList | null) => {
    if (!list?.length) return
    const merged = [...files]
    for (const f of Array.from(list))
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f)
    onChange(max ? merged.slice(0, max) : merged)
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          if (!disabled) add(e.dataTransfer.files)
        }}
        className={cn(
          'group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed px-4 py-8 text-center transition-all duration-200',
          'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60',
          over ? 'border-primary bg-primary-soft' : 'border-border-strong hover:border-primary/60 hover:bg-subtle',
        )}
      >
        <span
          className={cn(
            'bg-primary-soft text-primary grid size-11 place-items-center rounded-xl transition-transform duration-200',
            over ? 'scale-110' : 'group-hover:-translate-y-0.5',
          )}
        >
          <CloudUpload className="size-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="text-sm font-semibold">
          Kéo thả file vào đây hoặc <span className="text-primary">chọn từ máy</span>
        </span>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          add(e.target.files)
          e.target.value = ''
        }}
      />
      {files.length > 0 && (
        <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {files.map((f, i) => {
            const meta = KIND_META[fileKind(f.name, f.type)]
            const st = status?.[i]
            return (
              <li key={`${f.name}-${f.size}`} className="bg-subtle flex items-center gap-2.5 rounded-md px-2.5 py-2">
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', meta.soft)}>
                  <meta.icon className="size-4" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {fileSize(f.size)}
                    {st === 'uploading' && ' · Đang tải…'}
                    {st === 'done' && ' · Đã tải xong'}
                    {st === 'error' && ' · Lỗi'}
                  </p>
                </div>
                {st === 'uploading' ? (
                  <span className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent" aria-label="Đang tải" />
                ) : (
                  !disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Bỏ ${f.name}`}
                      onClick={() => onChange(files.filter((_, j) => j !== i))}
                    >
                      <X />
                    </Button>
                  )
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
