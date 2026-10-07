import { cn } from '@/lib/utils'

// Dấu thương hiệu: mũi tên kích thước kiểu bản vẽ kỹ thuật trên nền xanh (theo Figma)
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#3B6CF0] to-[#1F4FD1] text-white shadow-[0_4px_12px_-2px_rgba(31,79,209,0.5)] ring-1 ring-white/10 ring-inset',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[55%]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 7 7 17" />
        <path d="M7 9v8h8" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

export function BrandLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 font-bold tracking-tight', className)}>
      <BrandMark className={markClassName} />
      <span>4SigmaBrains</span>
    </div>
  )
}
