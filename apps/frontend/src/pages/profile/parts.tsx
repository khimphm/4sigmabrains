import type { ReactNode } from 'react'

import { Switch } from '@/components/ui/switch'
import type { OAuthProvider } from '@/features/profile/api'
import { cn } from '@/lib/utils'

// Thẻ nội dung theo Figma: nền surface, bo 10px, tiêu đề 17–20 Bold
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('bg-card shadow-card rounded-[10px] border', className)}>
      {title && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
              {icon}
              {title}
            </h2>
            {description && <p className="text-text-secondary mt-1 text-sm">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('px-5 pt-4 pb-5 md:px-6', bodyClassName)}>{children}</div>
    </section>
  )
}

// Một dòng bật/tắt có nhãn + mô tả (Figma: Nhận thông báo)
export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
  badge?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <label htmlFor={id} className={cn('min-w-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          {label}
          {badge}
        </span>
        {description && <span className="text-text-secondary mt-0.5 block text-[13px]">{description}</span>}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="cursor-pointer data-[size=default]:h-6 data-[size=default]:w-10 [&>span]:group-data-[size=default]/switch:size-5"
      />
    </div>
  )
}

export const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  github: 'GitHub',
}

// Logo đơn sắc (không dùng màu thương hiệu) để hợp với cả nền sáng và tối
export function ProviderIcon({ provider, className }: { provider: OAuthProvider | string; className?: string }) {
  const cls = cn('size-[18px]', className)
  if (provider === 'google')
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M21.35 11.1H12v2.98h5.35c-.23 1.43-1.7 4.2-5.35 4.2a5.94 5.94 0 0 1 0-11.88c1.85 0 3.1.79 3.8 1.47l2.6-2.5C16.74 3.82 14.6 2.9 12 2.9a9.1 9.1 0 1 0 0 18.2c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.05-.15-1.5Z" />
      </svg>
    )
  if (provider === 'microsoft')
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z" />
      </svg>
    )
  if (provider === 'github')
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    )
  return null
}

export function ProviderTile({ provider }: { provider: OAuthProvider }) {
  return (
    <span className="bg-subtle text-foreground grid size-10 shrink-0 place-items-center rounded-lg border">
      <ProviderIcon provider={provider} />
    </span>
  )
}
