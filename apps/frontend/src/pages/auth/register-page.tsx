import { Check, Loader2, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { FullPageLoader } from '@/components/full-page-loader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { homeFor, PASSWORD_RULE, useAuthProviders, useRegister, type UserStatus } from '@/features/auth/api'
import { useAuth } from '@/features/auth/use-auth'
import { errorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AuthLayout } from './auth-layout'
import { AuthHeading, Field, FormAlert, HeadingIcon, hasOAuth, OAuthButtons, OrDivider, PasswordField, PasswordStrength } from './auth-ui'

const NOTE_MAX = 500

export function RegisterPage() {
  const { user, isLoading } = useAuth()
  const providers = useAuthProviders()
  const register = useRegister()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ email: string; status: UserStatus } | null>(null)

  if (isLoading) return <FullPageLoader />
  if (user) return <Navigate to={homeFor(user)} replace />

  const p = providers.data
  const domains = p?.allowedDomains ?? []
  const domainOk = !domains.length || !email.includes('@') || domains.includes(email.split('@')[1]?.trim().toLowerCase() ?? '')
  const pwOk = PASSWORD_RULE.test(password)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!pwOk || !domainOk || name.trim().length < 2) return
    setError(null)
    register.mutate(
      { name: name.trim(), email: email.trim(), password, note: note.trim() || undefined },
      {
        onSuccess: (r) => setDone({ email: email.trim(), status: r.status }),
        onError: (err) => setError(errorMessage(err)),
      },
    )
  }

  if (done) return <RegisterDone {...done} />

  return (
    <AuthLayout
      tagline="Tham gia không gian làm việc của đội 4SigmaBrains."
      description="Gửi yêu cầu một lần — quản trị viên duyệt, bạn nhận thông báo và bắt đầu nhận việc, gán nhãn bản vẽ cùng cả nhóm."
    >
      <AuthHeading title="Yêu cầu tài khoản" description="Điền thông tin của bạn. Quản trị viên sẽ duyệt trước khi bạn vào được hệ thống." />

      {error && (
        <FormAlert>
          {error}
          {/đã có tài khoản/i.test(error) && (
            <>
              {' '}
              <Link to="/login" className="font-semibold underline underline-offset-2">
                Đăng nhập
              </Link>
            </>
          )}
        </FormAlert>
      )}

      {p && hasOAuth(p) && (
        <>
          <OAuthButtons providers={p} verb="Đăng ký với" />
          <OrDivider>hoặc đăng ký bằng email</OrDivider>
        </>
      )}

      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Họ và tên"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          placeholder="Nguyễn Văn An"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched && name.trim().length < 2 ? 'Nhập họ tên (tối thiểu 2 ký tự).' : null}
        />
        <Field
          label="Email công ty"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder={domains[0] ? `ten@${domains[0]}` : 'ten@congty.vn'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!domainOk ? `Chỉ chấp nhận email thuộc ${domains.map((d) => '@' + d).join(', ')}.` : null}
          hint={domains.length ? `Dùng email @${domains.join(', @')}.` : undefined}
        />
        <div className="space-y-3">
          <PasswordField
            name="new-password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={touched && !pwOk ? 'Mật khẩu chưa đạt yêu cầu bên dưới.' : null}
          />
          <PasswordStrength password={password} />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="note" className="text-sm font-semibold">
              Lời nhắn cho quản trị viên <span className="text-muted-foreground font-normal">(không bắt buộc)</span>
            </Label>
          </div>
          <Textarea
            id="note"
            rows={3}
            maxLength={NOTE_MAX}
            placeholder="VD: Nhóm kết cấu, bắt đầu làm dự án Tower A từ tuần sau."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[84px] resize-none px-3.5 text-[15px] md:text-[15px]"
          />
          <p className={cn('text-right text-[12px] num', note.length > NOTE_MAX - 50 ? 'text-due-soon-foreground' : 'text-muted-foreground')}>
            {note.length}/{NOTE_MAX}
          </p>
        </div>
        <Button type="submit" size="lg" className="h-11 w-full cursor-pointer text-[15px]" disabled={register.isPending}>
          {register.isPending && <Loader2 className="animate-spin" />}
          {register.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
        </Button>
      </form>

      <p className="text-text-secondary mt-7 text-sm">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary focus-visible:ring-ring/50 rounded-sm font-semibold outline-none hover:underline focus-visible:ring-[3px]">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}

function RegisterDone({ email, status }: { email: string; status: UserStatus }) {
  const active = status === 'ACTIVE'
  const steps = [
    { title: 'Gửi yêu cầu', text: `Đã ghi nhận ${email}`, done: true },
    { title: 'Quản trị viên duyệt', text: active ? 'Tài khoản được kích hoạt ngay' : 'Thường trong vòng 1 ngày làm việc', done: active },
    { title: 'Đăng nhập và bắt đầu', text: 'Dùng email và mật khẩu vừa tạo', done: false },
  ]
  return (
    <AuthLayout>
      <AuthHeading
        icon={
          <HeadingIcon tone="success">
            <MailCheck strokeWidth={1.8} />
          </HeadingIcon>
        }
        title={active ? 'Tài khoản đã sẵn sàng' : 'Đã gửi yêu cầu'}
        description={
          active
            ? 'Email của bạn thuộc danh sách quản trị viên nên tài khoản được kích hoạt ngay.'
            : 'Yêu cầu của bạn đang chờ quản trị viên duyệt. Bạn có thể đăng nhập để theo dõi trạng thái.'
        }
      />
      <ol className="border-border bg-subtle/60 mb-7 space-y-0 rounded-[10px] border p-4">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className={cn('absolute top-7 bottom-1 left-[11px] w-px', s.done ? 'bg-on-time-foreground/40' : 'bg-border-strong')} />}
            <span
              className={cn(
                'num grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold',
                s.done ? 'bg-on-time text-on-time-foreground' : 'bg-card text-muted-foreground border-border-strong border',
              )}
            >
              {s.done ? <Check className="size-3.5" strokeWidth={2.6} /> : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="text-sm font-semibold">
                {s.title}
                {s.done && <span className="sr-only"> (đã xong)</span>}
              </div>
              <div className="text-muted-foreground truncate text-[13px]">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>
      <Button asChild size="lg" className="h-11 w-full text-[15px]">
        <Link to="/login">Đến trang đăng nhập</Link>
      </Button>
    </AuthLayout>
  )
}
