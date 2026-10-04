import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#3B6CF0] to-[#1F4FD1] text-sm font-bold text-white shadow-[0_4px_12px_-2px_rgba(31,79,209,0.5)]',
        className,
      )}
    >
      4σ
    </span>
  )
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <BrandMark />
      <span>4SigmaBrains</span>
    </div>
  )
}
