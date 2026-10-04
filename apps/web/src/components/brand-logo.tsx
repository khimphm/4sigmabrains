import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-semibold', className)}>
      <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold">
        4σ
      </span>
      <span>4SigmaBrains</span>
    </div>
  )
}
