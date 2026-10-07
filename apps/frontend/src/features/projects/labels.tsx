import { cn } from '@/lib/utils'
import { LABEL_FALLBACK } from './project-utils'


// Chip nhãn: nền nhạt + viền + chữ theo màu nhãn (đọc được ở cả nền sáng và tối)
export function LabelChip({ name, color, className }: { name: string; color?: string; className?: string }) {
  const c = color ?? LABEL_FALLBACK
  return (
    <span
      className={cn(
        'inline-flex h-[22px] max-w-full items-center gap-1.5 truncate rounded-md border px-1.5 text-[12px] font-semibold',
        className,
      )}
      style={{
        color: `color-mix(in oklab, ${c} 82%, var(--foreground))`,
        backgroundColor: `color-mix(in oklab, ${c} 10%, transparent)`,
        borderColor: `color-mix(in oklab, ${c} 28%, transparent)`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: c }} aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  )
}
