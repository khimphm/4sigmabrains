import { AlertCircle, Check, Eye, EyeOff, Info, X } from 'lucide-react'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { passwordChecks, type AuthProviders } from '@/features/auth/api'
import { cn } from '@/lib/utils'

/* ---------- Biểu tượng nhà cung cấp ---------- */

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.5v-1.78c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.54-1.17-1.54-.95-.65.08-.64.08-.64 1.05.08 1.6 1.08 1.6 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.1-.27-.47-1.34.1-2.79 0 0 .88-.28 2.89 1.08a10 10 0 0 1 5.26 0c2-1.36 2.88-1.08 2.88-1.08.58 1.45.21 2.52.1 2.79.68.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  )
}

const oauthClass =
  'border-border-strong bg-card text-foreground hover:bg-subtle hover:border-foreground/25 focus-visible:ring-ring/50 inline-flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-md border text-sm font-semibold shadow-xs transition-colors duration-150 outline-none focus-visible:ring-[3px]'

/** Nút đăng nhập Google / Microsoft / GitHub — chỉ hiện các phương thức đã cấu hình. */
export function OAuthButtons({ providers, verb = 'Tiếp tục với' }: { providers: AuthProviders; verb?: string }) {
  const secondary = (['microsoft', 'github'] as const).filter((k) => providers[k])
  return (
    <div className="space-y-2.5">
      {providers.google && (
        <a href="/api/auth/google" className={cn(oauthClass, 'h-11 w-full')}>
          <GoogleIcon />
          {verb} Google
        </a>
      )}
      {secondary.length > 0 && (
        <div className={cn('grid gap-2.5', secondary.length === 2 && 'grid-cols-2')}>
          {secondary.map((k) => (
            <a key={k} href={`/api/auth/${k}`} className={oauthClass}>
              {k === 'microsoft' ? <MicrosoftIcon /> : <GitHubIcon />}
              {!providers.google && secondary.length === 1 ? `${verb} ` : ''}
              {k === 'microsoft' ? 'Microsoft' : 'GitHub'}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function OrDivider({ children = 'hoặc dùng email' }: { children?: ReactNode }) {
  return (
    <div className="text-muted-foreground my-6 flex items-center gap-3 text-[13px]">
      <span className="bg-border h-px flex-1" />
      {children}
      <span className="bg-border h-px flex-1" />
    </div>
  )
}

/* ---------- Tiêu đề trang auth ---------- */

export function AuthHeading({ title, description, icon }: { title: ReactNode; description?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-7">
      {icon}
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">{title}</h1>
      {description && <p className="text-text-secondary mt-2 text-[15px] leading-relaxed">{description}</p>}
    </div>
  )
}

export function HeadingIcon({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'success' | 'danger' }) {
  return (
    <span
      className={cn(
        'mb-5 grid size-12 place-items-center rounded-xl [&_svg]:size-[22px]',
        tone === 'primary' && 'bg-primary-soft text-primary',
        tone === 'success' && 'bg-on-time text-on-time-foreground',
        tone === 'danger' && 'bg-overdue text-overdue-foreground',
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Thông báo trong form ---------- */

export function FormAlert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  const Icon = tone === 'error' ? AlertCircle : Info
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-5 flex gap-2.5 rounded-md border px-3 py-2.5 text-sm leading-snug',
        tone === 'error' ? 'border-destructive/25 bg-destructive/[0.06] text-destructive' : 'border-primary/20 bg-primary-soft text-foreground',
      )}
    >
      <Icon className={cn('mt-px size-4 shrink-0', tone === 'info' && 'text-primary')} strokeWidth={1.8} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/* ---------- Trường nhập ---------- */

type FieldProps = ComponentProps<typeof Input> & { label: ReactNode; labelAside?: ReactNode; hint?: ReactNode; error?: string | null }

export function Field({ label, labelAside, hint, error, id, className, ...props }: FieldProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={fid} className="text-sm font-semibold">
          {label}
        </Label>
        {labelAside}
      </div>
      <Input
        id={fid}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${fid}-desc` : undefined}
        className={cn('h-11 px-3.5 text-[15px] md:text-[15px]', className)}
        {...props}
      />
      {(error || hint) && (
        <p id={`${fid}-desc`} className={cn('text-[13px]', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function PasswordField({ label = 'Mật khẩu', labelAside, hint, error, id, className, ...props }: Omit<FieldProps, 'label' | 'type'> & { label?: ReactNode }) {
  const auto = useId()
  const fid = id ?? auto
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  const desc = error || hint || caps
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={fid} className="text-sm font-semibold">
          {label}
        </Label>
        {labelAside}
      </div>
      <div className="relative">
        <Input
          id={fid}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error || undefined}
          aria-describedby={desc ? `${fid}-desc` : undefined}
          onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
          className={cn('h-11 pr-11 pl-3.5 text-[15px] md:text-[15px]', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={show}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-[3px]"
        >
          {show ? <EyeOff className="size-[18px]" strokeWidth={1.8} /> : <Eye className="size-[18px]" strokeWidth={1.8} />}
        </button>
      </div>
      {desc && (
        <p id={`${fid}-desc`} className={cn('text-[13px]', error ? 'text-destructive' : caps ? 'text-due-soon-foreground' : 'text-muted-foreground')}>
          {error || (caps ? 'Phím Caps Lock đang bật.' : hint)}
        </p>
      )}
    </div>
  )
}

/* ---------- Độ mạnh mật khẩu ---------- */

function strength(pw: string) {
  if (!pw) return 0
  let s = passwordChecks(pw).filter((c) => c.ok).length // 0..3
  if (s === 3 && (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) && /[a-z]/.test(pw) && /[A-Z]/.test(pw)) s = 4
  return s
}

const STRENGTH = [
  { label: 'Chưa nhập', bar: 'bg-border', text: 'text-muted-foreground' },
  { label: 'Yếu', bar: 'bg-destructive', text: 'text-destructive' },
  { label: 'Yếu', bar: 'bg-destructive', text: 'text-destructive' },
  { label: 'Đạt yêu cầu', bar: 'bg-primary', text: 'text-primary' },
  { label: 'Mạnh', bar: 'bg-[#2F9E6A]', text: 'text-on-time-foreground' },
]

export function PasswordStrength({ password }: { password: string }) {
  const s = strength(password)
  const meta = STRENGTH[s]
  return (
    <div className="space-y-2.5" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-200', i <= s ? meta.bar : 'bg-border')} />
          ))}
        </div>
        <span className={cn('shrink-0 text-[12px] font-semibold', meta.text)}>Độ mạnh: {meta.label}</span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {passwordChecks(password).map((c) => (
          <li key={c.label} className={cn('flex items-center gap-1.5 text-[13px] transition-colors duration-150', c.ok ? 'text-on-time-foreground' : 'text-muted-foreground')}>
            <span className={cn('grid size-4 place-items-center rounded-full', c.ok ? 'bg-on-time' : 'bg-subtle')}>
              {c.ok ? <Check className="size-3" strokeWidth={2.6} /> : <X className="size-2.5" strokeWidth={2.4} />}
            </span>
            {c.label}
            <span className="sr-only">{c.ok ? '(đạt)' : '(chưa đạt)'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
