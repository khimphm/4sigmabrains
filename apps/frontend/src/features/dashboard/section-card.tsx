import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Khối nội dung kiểu Figma: tiêu đề 17 Bold + phần phụ bên phải
export function SectionCard({
  title,
  aside,
  children,
  className,
  bodyClassName,
  id,
}: {
  title: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  id?: string
}) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section
      aria-labelledby={headingId}
      className={cn('bg-card shadow-card min-w-0 rounded-[10px] border', className)}
    >
      <header className="flex min-h-14 items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 id={headingId} className="text-[17px] leading-tight font-bold tracking-tight">
          {title}
        </h2>
        {aside && <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-[13px]">{aside}</div>}
      </header>
      <div className={cn('px-5 pb-5', bodyClassName)}>{children}</div>
    </section>
  )
}

// Ô vuông nhỏ chỉ màu dự án
export function ProjectDot({ color, className }: { color: string | null | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 shrink-0 rounded-[2px]', className)}
      style={{ background: color ?? 'var(--muted-foreground)' }}
    />
  )
}
