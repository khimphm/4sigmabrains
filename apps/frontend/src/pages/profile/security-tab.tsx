import {
  Check,
  Copy,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  MonitorSmartphone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Pill } from '@/components/pill'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  linkProvider,
  useChangePassword,
  useDisableTotp,
  useEnableTotp,
  useLoginMethods,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
  useSetupTotp,
  useUnlinkProvider,
  type LoginMethods,
  type LoginSession,
  PROVIDER_LABEL,
  type OAuthProvider,
  type TotpSetup,
} from '@/features/profile/api'
import { METHOD_LABEL, parseUserAgent } from '@/features/profile/user-agent'
import { errorMessage } from '@/lib/api'
import { fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'
import { ProviderTile, SectionCard } from './parts'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const PROVIDERS: OAuthProvider[] = ['google', 'microsoft', 'github']

export function SecurityTab({ user }: { user: User }) {
  const methods = useLoginMethods()
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="min-w-0 space-y-6">
        <LinkedAccounts methods={methods.data} loading={methods.isLoading} />
        <PasswordCard hasPassword={methods.data?.password} loading={methods.isLoading} />
      </div>
      <div className="min-w-0 space-y-6">
        <TwoFactorCard enabled={methods.data?.totpEnabled ?? user.totpEnabled} />
        <SessionsCard lastLoginAt={user.lastLoginAt} />
      </div>
    </div>
  )
}

// ---------- Tài khoản liên kết ----------

function LinkedAccounts({ methods, loading }: { methods?: LoginMethods; loading: boolean }) {
  const unlink = useUnlinkProvider()
  const [confirm, setConfirm] = useState<OAuthProvider | null>(null)
  const linkedCount = methods ? PROVIDERS.filter((p) => methods.linked[p]).length + Number(methods.password) : 0

  return (
    <SectionCard
      title="Tài khoản liên kết"
      description="Đăng nhập nhanh bằng tài khoản công việc. Cần giữ ít nhất một cách đăng nhập."
      bodyClassName="pt-2"
    >
      {loading || !methods ? (
        <div className="space-y-3 pt-2">
          {PROVIDERS.map((p) => (
            <Skeleton key={p} className="h-14" />
          ))}
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {PROVIDERS.map((p) => {
            const linked = methods.linked[p]
            const available = methods.available[p]
            return (
              <li key={p} className="flex flex-wrap items-center gap-3 py-3.5">
                <ProviderTile provider={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    {PROVIDER_LABEL[p]}
                    {linked && <Pill tone="on-time">Đã liên kết</Pill>}
                  </div>
                  <div className="text-text-secondary truncate text-[13px]">
                    {linked ? methods.email : available ? 'Chưa liên kết' : 'Máy chủ chưa cấu hình đăng nhập này'}
                  </div>
                </div>
                {linked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirm(p)}
                    disabled={unlink.isPending && unlink.variables === p}
                  >
                    {unlink.isPending && unlink.variables === p && <Loader2 className="animate-spin" />}
                    Huỷ liên kết
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled={!available} onClick={() => linkProvider(p)} title={available ? undefined : 'Chưa cấu hình'}>
                    Liên kết
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Huỷ liên kết {confirm && PROVIDER_LABEL[confirm]}?</AlertDialogTitle>
            <AlertDialogDescription>
              {linkedCount <= 1
                ? 'Đây là cách đăng nhập duy nhất của bạn. Hãy đặt mật khẩu hoặc liên kết tài khoản khác trước khi huỷ.'
                : 'Bạn sẽ không thể đăng nhập bằng tài khoản này nữa cho đến khi liên kết lại.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                const p = confirm!
                unlink.mutate(p, {
                  onSuccess: () => toast.success(`Đã huỷ liên kết ${PROVIDER_LABEL[p]}`),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }}
            >
              Huỷ liên kết
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}

// ---------- Mật khẩu ----------

function PasswordCard({ hasPassword, loading }: { hasPassword?: boolean; loading: boolean }) {
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const rules = [
    { ok: next.length >= 8, label: 'Ít nhất 8 ký tự' },
    { ok: /[A-Za-z]/.test(next), label: 'Có chữ cái' },
    { ok: /\d/.test(next), label: 'Có chữ số' },
  ]
  const valid = PASSWORD_RULE.test(next) && next === again && (!hasPassword || current.length > 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    change.mutate(
      { currentPassword: hasPassword ? current : undefined, newPassword: next },
      {
        onSuccess: () => {
          toast.success(hasPassword ? 'Đã đổi mật khẩu' : 'Đã đặt mật khẩu')
          setCurrent('')
          setNext('')
          setAgain('')
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <SectionCard
      title="Mật khẩu"
      icon={<KeyRound className="size-[18px]" strokeWidth={1.8} />}
      description={
        loading ? undefined : hasPassword ? 'Đổi mật khẩu đăng nhập bằng email.' : 'Bạn đang đăng nhập bằng tài khoản liên kết. Đặt mật khẩu để có thêm một cách đăng nhập.'
      }
    >
      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {hasPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="pw-current">Mật khẩu hiện tại</Label>
              <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pw-new">Mật khẩu mới</Label>
              <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-again">Nhập lại mật khẩu mới</Label>
              <Input
                id="pw-again"
                type="password"
                autoComplete="new-password"
                value={again}
                aria-invalid={!!again && again !== next}
                onChange={(e) => setAgain(e.target.value)}
              />
              {again && again !== next && <p className="text-overdue-foreground text-xs">Mật khẩu nhập lại chưa khớp</p>}
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" aria-label="Yêu cầu mật khẩu">
            {rules.map((r) => (
              <li key={r.label} className={cn('flex items-center gap-1.5 transition-colors', r.ok ? 'text-on-time-foreground' : 'text-muted-foreground')}>
                {r.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                {r.label}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={!valid || change.isPending}>
              {change.isPending && <Loader2 className="animate-spin" />}
              {hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
            </Button>
          </div>
        </form>
      )}
    </SectionCard>
  )
}

// ---------- Xác thực 2 lớp ----------

function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const [setupOpen, setSetupOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  return (
    <SectionCard
      title="Xác thực 2 lớp"
      icon={<ShieldCheck className="size-[18px]" strokeWidth={1.8} />}
      description="Nhập thêm mã 6 số từ ứng dụng Google Authenticator, Microsoft Authenticator hoặc 1Password khi đăng nhập."
    >
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-lg p-4',
          enabled ? 'bg-on-time text-on-time-foreground' : 'bg-due-soon text-due-soon-foreground',
        )}
      >
        {enabled ? <ShieldCheck className="size-6 shrink-0" strokeWidth={1.8} /> : <ShieldAlert className="size-6 shrink-0" strokeWidth={1.8} />}
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-semibold">{enabled ? 'Đang bật' : 'Chưa bật'}</div>
          <div className="opacity-90">
            {enabled ? 'Mỗi lần đăng nhập trên thiết bị mới cần mã xác thực.' : 'Nên bật để bảo vệ bản vẽ và dữ liệu khách hàng.'}
          </div>
        </div>
        {enabled ? (
          <Button variant="outline" size="sm" onClick={() => setDisableOpen(true)}>
            Tắt
          </Button>
        ) : (
          <Button size="sm" onClick={() => setSetupOpen(true)}>
            Bật xác thực 2 lớp
          </Button>
        )}
      </div>
      {setupOpen && <SetupDialog onClose={() => setSetupOpen(false)} />}
      {disableOpen && <DisableDialog onClose={() => setDisableOpen(false)} />}
    </SectionCard>
  )
}

function CodeInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <Input
      id={id}
      autoFocus
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className="num h-12 text-center text-2xl font-bold tracking-[0.5em]"
    />
  )
}

function SetupDialog({ onClose }: { onClose: () => void }) {
  const setup = useSetupTotp()
  const enable = useEnableTotp()
  const [data, setData] = useState<TotpSetup | null>(null)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const started = useRef(false)
  const { mutate: start } = setup

  // Tạo khoá mới một lần khi mở hộp thoại
  useEffect(() => {
    if (started.current) return
    started.current = true
    start(undefined, { onSuccess: setData, onError: (e) => toast.error(errorMessage(e)) })
  }, [start])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    enable.mutate(code, {
      onSuccess: () => {
        toast.success('Đã bật xác thực 2 lớp')
        onClose()
      },
      onError: (err) => {
        toast.error(errorMessage(err))
        setCode('')
      },
    })
  }

  const secretGroups = data?.secret.match(/.{1,4}/g)?.join(' ')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bật xác thực 2 lớp</DialogTitle>
          <DialogDescription>Quét mã QR bằng ứng dụng xác thực, sau đó nhập mã 6 số hiển thị trong ứng dụng.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <ol className="space-y-4 text-sm">
            <li className="flex flex-col items-center gap-3">
              <div className="grid size-[200px] place-items-center rounded-lg border bg-white p-2">
                {data ? <img src={data.qrDataUrl} alt="Mã QR xác thực 2 lớp" className="size-full" /> : <Skeleton className="size-full" />}
              </div>
              <div className="w-full">
                <div className="text-muted-foreground mb-1 text-xs">Không quét được? Nhập khoá thủ công:</div>
                <div className="bg-subtle flex items-center gap-2 rounded-md border px-3 py-2">
                  <code className="num min-w-0 flex-1 truncate text-sm font-semibold tracking-wider">{secretGroups ?? '…'}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Sao chép khoá"
                    disabled={!data}
                    onClick={() => {
                      navigator.clipboard.writeText(data!.secret).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      })
                    }}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
              </div>
            </li>
          </ol>
          <div className="space-y-1.5">
            <Label htmlFor="totp-code">Mã xác thực</Label>
            <CodeInput id="totp-code" value={code} onChange={setCode} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Để sau
            </Button>
            <Button type="submit" disabled={code.length !== 6 || !data || enable.isPending}>
              {enable.isPending && <Loader2 className="animate-spin" />}
              Xác nhận và bật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DisableDialog({ onClose }: { onClose: () => void }) {
  const disable = useDisableTotp()
  const [code, setCode] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    disable.mutate(code, {
      onSuccess: () => {
        toast.success('Đã tắt xác thực 2 lớp')
        onClose()
      },
      onError: (err) => {
        toast.error(errorMessage(err))
        setCode('')
      },
    })
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tắt xác thực 2 lớp</DialogTitle>
          <DialogDescription>Nhập mã 6 số hiện tại trong ứng dụng xác thực để xác nhận.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="totp-off">Mã xác thực</Label>
            <CodeInput id="totp-off" value={code} onChange={setCode} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" variant="destructive" disabled={code.length !== 6 || disable.isPending}>
              {disable.isPending && <Loader2 className="animate-spin" />}
              Tắt xác thực 2 lớp
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Phiên đăng nhập ----------

function SessionsCard({ lastLoginAt }: { lastLoginAt: string | null }) {
  const { data, isLoading } = useSessions()
  const revoke = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
  const [confirmAll, setConfirmAll] = useState(false)
  const others = data?.filter((s) => !s.current).length ?? 0

  return (
    <SectionCard
      title="Phiên đăng nhập"
      icon={<MonitorSmartphone className="size-[18px]" strokeWidth={1.8} />}
      description={`Đăng nhập gần nhất: ${lastLoginAt ? fmtDateTime(lastLoginAt) : 'chưa ghi nhận'}`}
      action={
        others > 0 && (
          <Button variant="outline" size="sm" onClick={() => setConfirmAll(true)} disabled={revokeOthers.isPending}>
            {revokeOthers.isPending ? <Loader2 className="animate-spin" /> : <LogOut strokeWidth={1.8} />}
            Đăng xuất nơi khác
          </Button>
        )
      }
      bodyClassName="pt-2"
    >
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {data?.map((s) => (
            <SessionRow
              key={s.id}
              s={s}
              onRevoke={() =>
                revoke.mutate(s.id, {
                  onSuccess: () => toast.success('Đã đăng xuất thiết bị'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            />
          ))}
        </ul>
      )}

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất {others} thiết bị khác?</AlertDialogTitle>
            <AlertDialogDescription>Chỉ giữ lại phiên trên thiết bị này. Các thiết bị khác cần đăng nhập lại.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                revokeOthers.mutate(undefined, {
                  onSuccess: () => toast.success('Đã đăng xuất các thiết bị khác'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Đăng xuất tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}

function SessionRow({ s, onRevoke }: { s: LoginSession; onRevoke: () => void }) {
  const ua = parseUserAgent(s.userAgent)
  const Icon = ua.device === 'mobile' ? Smartphone : ua.device === 'tablet' ? Tablet : Laptop
  return (
    <li className="flex items-center gap-3 py-3.5">
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-lg border',
          s.current ? 'bg-primary-soft text-primary border-transparent' : 'bg-subtle text-text-secondary',
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
          {ua.os.startsWith('Không rõ') ? ua.browser : `${ua.browser} trên ${ua.os}`}
          {s.current && <Pill tone="primary">Thiết bị này</Pill>}
        </div>
        <div className="text-text-secondary truncate text-[13px]">
          {[s.ip, METHOD_LABEL[s.method] ?? s.method, s.current ? 'Đang hoạt động' : `Hoạt động ${fromNow(s.lastSeenAt)}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </div>
      {!s.current && (
        <Button variant="ghost" size="sm" onClick={onRevoke} className="text-text-secondary hover:text-overdue-foreground">
          Đăng xuất
        </Button>
      )}
    </li>
  )
}
