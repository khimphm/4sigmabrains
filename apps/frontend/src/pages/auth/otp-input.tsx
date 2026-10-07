import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
}

// Ô nhập mã 6 số: tự chuyển ô, dán cả mã, Backspace lùi ô.
export function OtpInput({ value, onChange, onComplete, length = 6, disabled, invalid, autoFocus }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const commit = (next: string) => {
    const v = next.replace(/\D/g, '').slice(0, length)
    onChange(v)
    if (v.length === length) onComplete?.(v)
    return v
  }

  const setAt = (i: number, d: string) => {
    const arr = digits.slice()
    arr[i] = d
    // Ghép lại, bỏ ô trống ở giữa
    return commit(arr.join(''))
  }

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) setAt(i, '')
      else if (i > 0) {
        setAt(i - 1, '')
        focus(i - 1)
      }
    } else if (e.key === 'ArrowLeft') focus(i - 1)
    else if (e.key === 'ArrowRight') focus(i + 1)
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!text) return
    e.preventDefault()
    const v = commit(text)
    focus(v.length)
  }

  return (
    <div className="flex gap-2 sm:gap-2.5" role="group" aria-label="Mã xác thực 6 số">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Chữ số ${i + 1}`}
          aria-invalid={invalid || undefined}
          onPaste={onPaste}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '')
            if (raw.length > 1) {
              const v = commit(value.slice(0, i) + raw)
              focus(v.length)
              return
            }
            const ch = raw.slice(-1)
            if (!ch) return
            setAt(i, ch)
            focus(i + 1)
          }}
          className={cn(
            'border-input bg-card num h-14 w-full min-w-0 rounded-md border text-center text-[22px] font-bold shadow-xs transition-[border-color,box-shadow] duration-150 outline-none dark:bg-input/30',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            d && 'border-border-strong',
            invalid && 'border-destructive ring-destructive/20 ring-[3px]',
            'disabled:opacity-60',
          )}
        />
      ))}
    </div>
  )
}
