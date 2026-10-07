import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Thẻ nội dung của trang chi tiết (Figma 04: bo 10px, viền, tiêu đề 17–20 Bold)
export function SectionCard({
  title,
  icon: Icon,
  aside,
  children,
  className,
  id,
  size = 'L',
}: {
  title: ReactNode
  icon?: LucideIcon
  aside?: ReactNode
  children: ReactNode
  className?: string
  id?: string
  size?: 'L' | 'M'
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn('bg-card shadow-card rounded-[10px] border p-5 md:p-6', className)}
    >
      <header className="mb-4 flex min-h-7 items-center gap-3">
        <h2
          id={id ? `${id}-title` : undefined}
          className={cn('flex items-center gap-2 font-bold tracking-tight', size === 'L' ? 'text-lg' : 'text-[17px]')}
        >
          {Icon && <Icon className="text-text-secondary size-[18px]" strokeWidth={1.8} aria-hidden />}
          {title}
        </h2>
        {aside && <div className="ml-auto flex min-w-0 items-center gap-2">{aside}</div>}
      </header>
      {children}
    </section>
  )
}
