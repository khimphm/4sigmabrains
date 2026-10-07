import { ChevronRight } from 'lucide-react'
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

export const TopbarSlotContext = createContext<{ crumbs: HTMLElement | null; actions: HTMLElement | null }>({
  crumbs: null,
  actions: null,
})

// Mỗi trang khai báo breadcrumb + nút hành động chính; chúng hiện trên thanh trên cùng (Figma: Top bar).
export function PageTopbar({ crumbs, actions, title }: { crumbs: Crumb[]; actions?: ReactNode; title?: string }) {
  const slots = useContext(TopbarSlotContext)
  const docTitle = title ?? crumbs[crumbs.length - 1]?.label
  useEffect(() => {
    document.title = docTitle ? `${docTitle} · 4SigmaBrains` : '4SigmaBrains'
  }, [docTitle])

  return (
    <>
      {slots.crumbs &&
        createPortal(
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1
              return (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />}
                  {c.to && !last ? (
                    <Link to={c.to} className="text-muted-foreground hover:text-foreground truncate transition-colors">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={last ? 'text-foreground truncate font-semibold' : 'text-muted-foreground truncate'}>
                      {c.label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>,
          slots.crumbs,
        )}
      {slots.actions && actions && createPortal(actions, slots.actions)}
    </>
  )
}
