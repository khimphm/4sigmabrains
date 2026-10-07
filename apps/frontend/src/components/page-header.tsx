import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions, children }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">{title}</h1>
          {description && <p className="text-text-secondary mt-1 text-[15px]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function PageContainer({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-4 py-6 md:px-8 md:py-7 ${wide ? 'max-w-[1600px]' : 'max-w-[1280px]'}`}>{children}</div>
}
