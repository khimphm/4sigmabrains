import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { FullPageLoader } from '@/components/full-page-loader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { hasOAuth, homeFor, useAuthProviders, useLogin, useVerify2fa } from '@/features/auth/api'
import { useAuth } from '@/features/auth/use-auth'
import { ApiError, errorMessage } from '@/lib/api'
import { AuthLayout } from './auth-layout'
import { AuthHeading, Field, FormAlert, HeadingIcon, OAuthButtons, OrDivider, PasswordField } from './auth-ui'
import { OtpInput } from './otp-input'

function oauthError(raw: string | null) {
  if (!raw) return null
  if (raw === 'oauth') return 'Đăng nhập không thành công hoặc đã bị huỷ. Vui lòng thử lại.'
  return raw
}

export function LoginPage() {
  const { user, isLoading } = useAuth()
  const [params, setParams] = useSearchParams()
  const next = params.get('next')
  const [step2fa, setStep2fa] = useState(params.get('step') === '2fa')

  if (isLoading) return <FullPageLoader />
  if (user) return <Navigate to={homeFor(user, next)} replace />

  const back = () => {
    setStep2fa(false)
    const p = new URLSearchParams(params)
    p.delete('step')
    setParams(p, { replace: true })
  }

  return (
    <AuthLayout>
      {step2fa ? <TwoFactorStep next={next} onBack={back} /> : <CredentialsStep next={next} error={oauthError(params.get('error'))} onTotp={() => setStep2fa(true)} />}
    </AuthLayout>
  )
}

function CredentialsStep({ next, error, onTotp }: { next: string | null; error: string | null; onTotp: () => void }) {
  const navigate = useNavigate()
  const providers = useAuthProviders()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const p = providers.data
  const domains = p?.allowedDomains ?? []
  const domainText = domains.map((d) => `@${d}`).join(', ')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    login.mutate(
      { email: email.trim(), password, remember },
      {
        onSuccess: ({ res, me }) => {
          if (res.totpRequired) return onTotp()
          navigate(homeFor(me, next), { replace: true })
        },
        onError: (err) => setFormError(errorMessage(err)),
      },
    )
  }

  const shownError = formError ?? error

  return (
    <>
      <AuthHeading
        title="Đăng nhập"
        description={hasOAuth(p) ? 'Dùng tài khoản công ty để vào nhanh nhất.' : 'Nhập email và mật khẩu để vào không gian làm việc.'}
      />

      {shownError && <FormAlert>{shownError}</FormAlert>}

      {providers.isLoading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        p &&
        hasOAuth(p) && (
          <>
            <OAuthButtons providers={p} />
            {domains.length > 0 && (
              <p className="text-muted-foreground mt-3 text-[13px] leading-snug">
                Chỉ email thuộc tên miền {domainText} được đăng nhập.
              </p>
            )}
            <OrDivider />
          </>
        )
      )}

      <form onSubmit={submit} className="space-y-5" noValidate={false}>
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="username"
          required
          autoFocus={!hasOAuth(p)}
          placeholder={domains[0] ? `ten@${domains[0]}` : 'ten@congty.vn'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAside={
            <Link
              to={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
              className="text-primary focus-visible:ring-ring/50 rounded-sm text-[13px] font-semibold outline-none hover:underline focus-visible:ring-[3px]"
            >
              Quên mật khẩu?
            </Link>
          }
        />
        <div className="flex items-center gap-2.5">
          <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} className="size-[18px] cursor-pointer" />
          <Label htmlFor="remember" className="text-text-secondary cursor-pointer text-sm font-normal">
            Ghi nhớ đăng nhập trên máy này
          </Label>
        </div>
        <Button type="submit" size="lg" className="h-11 w-full cursor-pointer text-[15px]" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" />}
          {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>

      <p className="text-text-secondary mt-7 text-sm leading-relaxed">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary focus-visible:ring-ring/50 rounded-sm font-semibold outline-none hover:underline focus-visible:ring-[3px]">
          Gửi yêu cầu đăng ký
        </Link>
        . Quản trị viên duyệt trước khi bạn vào được hệ thống.
      </p>
    </>
  )
}

function TwoFactorStep({ next, onBack }: { next: string | null; onBack: () => void }) {
  const navigate = useNavigate()
  const verify = useVerify2fa()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  const submit = (value = code) => {
    if (value.length !== 6 || verify.isPending) return
    setError(null)
    verify.mutate(value, {
      onSuccess: (me) => navigate(homeFor(me, next), { replace: true }),
      onError: (err) => {
        setError(errorMessage(err))
        setCode('')
        if (err instanceof ApiError && /hết hạn|đăng nhập lại/i.test(err.message)) setExpired(true)
      },
    })
  }

  return (
    <>
      <AuthHeading
        icon={
          <HeadingIcon>
            <ShieldCheck strokeWidth={1.8} />
          </HeadingIcon>
        }
        title="Xác thực 2 lớp"
        description="Mở ứng dụng xác thực (Google Authenticator, Microsoft Authenticator, Authy…) và nhập mã 6 số đang hiển thị."
      />

      {error && (
        <FormAlert>
          {error}
          {expired && (
            <button type="button" onClick={onBack} className="ml-1 cursor-pointer font-semibold underline underline-offset-2">
              Đăng nhập lại
            </button>
          )}
        </FormAlert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-5"
      >
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={verify.isPending} invalid={!!error && !code} autoFocus />
        <p className="text-muted-foreground text-[13px]">Mã đổi sau mỗi 30 giây. Phiên xác thực có hiệu lực trong 10 phút.</p>
        <Button type="submit" size="lg" className="h-11 w-full cursor-pointer text-[15px]" disabled={code.length !== 6 || verify.isPending}>
          {verify.isPending && <Loader2 className="animate-spin" />}
          {verify.isPending ? 'Đang xác thực…' : 'Xác nhận'}
        </Button>
      </form>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-text-secondary hover:text-foreground focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1.5 rounded-sm font-medium transition-colors outline-none focus-visible:ring-[3px]"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
          Quay lại đăng nhập
        </button>
        <span className="text-muted-foreground text-[13px]">Mất thiết bị? Liên hệ quản trị viên.</span>
      </div>
    </>
  )
}
