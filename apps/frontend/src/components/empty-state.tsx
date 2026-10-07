import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center', className)}>
      <div className="relative mb-4">
        <div className="bg-primary/10 absolute inset-0 scale-150 rounded-full blur-xl" />
        <span className="bg-card text-primary relative grid size-12 place-items-center rounded-xl border shadow-sm">
          <Icon className="size-5" />
        </span>
      </div>
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
