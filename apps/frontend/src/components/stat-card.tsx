import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function StatCard({ icon: Icon, label, value, hint, tone = 'default', onClick }: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'danger' | 'success' | 'warning'
  onClick?: () => void
}) {
  const tones = {
    default: 'bg-primary/10 text-primary',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'bg-card group relative overflow-hidden rounded-xl border p-4 text-left shadow-xs transition-all',
        onClick && 'hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground text-sm leading-tight">{label}</span>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tones[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="text-muted-foreground mt-1 text-xs">{hint}</div>}
    </button>
  )
}
