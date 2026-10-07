import { CircleCheck, KeyRound, Link2Off, Loader2, ShieldPlus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { PASSWORD_RULE, useResetPassword } from '@/features/auth/api'
import { errorMessage } from '@/lib/api'
import { fmtDateTime } from '@/lib/format'
import { AuthLayout } from './auth-layout'
import { AuthHeading, FormAlert, HeadingIcon, PasswordField, PasswordStrength } from './auth-ui'

// Đọc thời hạn trong JWT (không xác minh chữ ký) để báo sớm link hết hạn và nhận biết link mời (hạn dài > 1 giờ).
function readToken(token: string | null) {
  if (!token) return null
  try {
    const part = token.split('.')[1]
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number; iat?: number }
    if (!json.exp) return null
    return { exp: new Date(json.exp * 1000), invite: !!json.iat && json.exp - json.iat > 3600 }
  } catch {
    return null
  }
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const info = useMemo(() => readToken(token), [token])
  const invite = params.get('invite') === '1' || !!info?.invite
  const reset = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // eslint-disable-next-line react-hooks/purity
  const expired = useMemo(() => !!info && info.exp.getTime() < Date.now(), [info])

  const pwOk = PASSWORD_RULE.test(password)
  const match = password === confirm

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!token || !pwOk || !match) return
    setError(null)
    reset.mutate({ token, password }, { onSuccess: () => setDone(true), onError: (err) => setError(errorMessage(err)) })
  }

  if (!token || expired || (error && /hết hạn|không hợp lệ|đã được dùng/i.test(error)))
    return (
      <AuthLayout>
        <AuthHeading
          icon={
            <HeadingIcon tone="danger">
              <Link2Off strokeWidth={1.8} />
            </HeadingIcon>
          }
          title="Liên kết không dùng được"
          description={
            error ??
            (expired
              ? `Liên kết đã hết hạn lúc ${fmtDateTime(info!.exp)}. Hãy yêu cầu liên kết mới.`
              : 'Liên kết thiếu mã xác thực. Hãy mở lại đúng liên kết trong email hoặc yêu cầu liên kết mới.')
          }
        />
        <div className="flex flex-wrap gap-2.5">
          <Button asChild size="lg" className="h-11">
            <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </div>
        {invite && <p className="text-muted-foreground mt-5 text-[13px]">Link mời đã hết hạn? Nhờ quản trị viên gửi lời mời mới.</p>}
      </AuthLayout>
    )

  if (done)
    return (
      <AuthLayout>
        <AuthHeading
          icon={
            <HeadingIcon tone="success">
              <CircleCheck strokeWidth={1.8} />
            </HeadingIcon>
          }
          title="Đã đặt mật khẩu"
          description={
            invite
              ? 'Tài khoản của bạn đã sẵn sàng. Đăng nhập bằng email và mật khẩu vừa tạo.'
              : 'Mật khẩu mới đã được lưu. Vì an toàn, mọi phiên đăng nhập cũ đã được đăng xuất.'
          }
        />
        <Button asChild size="lg" className="h-11 w-full text-[15px]">
          <Link to="/login">Đăng nhập ngay</Link>
        </Button>
      </AuthLayout>
    )

  return (
    <AuthLayout
      tagline={invite ? 'Chào mừng bạn đến với 4SigmaBrains.' : undefined}
      description={invite ? 'Đặt mật khẩu để bắt đầu nhận việc, trao đổi trên bản vẽ và chốt kết quả cùng cả nhóm.' : undefined}
    >
      <AuthHeading
        icon={<HeadingIcon>{invite ? <ShieldPlus strokeWidth={1.8} /> : <KeyRound strokeWidth={1.8} />}</HeadingIcon>}
        title={invite ? 'Đặt mật khẩu' : 'Đặt mật khẩu mới'}
        description={
          invite
            ? 'Bạn được mời vào không gian làm việc. Tạo mật khẩu để hoàn tất tài khoản.'
            : 'Tạo mật khẩu mới cho tài khoản. Các thiết bị đang đăng nhập sẽ bị đăng xuất.'
        }
      />
      {error && <FormAlert>{error}</FormAlert>}
      {info && (
        <p className="text-muted-foreground -mt-3 mb-5 text-[13px]">
          Liên kết có hiệu lực đến <span className="num text-text-secondary font-semibold">{fmtDateTime(info.exp)}</span>
        </p>
      )}
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-3">
          <PasswordField
            label="Mật khẩu mới"
            name="new-password"
            autoComplete="new-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={touched && !pwOk ? 'Mật khẩu chưa đạt yêu cầu bên dưới.' : null}
          />
          <PasswordStrength password={password} />
        </div>
        <PasswordField
          label="Nhập lại mật khẩu"
          name="confirm-password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={(touched || confirm.length >= password.length) && confirm && !match ? 'Mật khẩu nhập lại không khớp.' : null}
          hint={confirm && match && pwOk ? 'Khớp mật khẩu.' : undefined}
        />
        <Button type="submit" size="lg" className="h-11 w-full cursor-pointer text-[15px]" disabled={reset.isPending}>
          {reset.isPending && <Loader2 className="animate-spin" />}
          {reset.isPending ? 'Đang lưu…' : invite ? 'Đặt mật khẩu và tiếp tục' : 'Lưu mật khẩu mới'}
        </Button>
      </form>
      <p className="text-text-secondary mt-7 text-sm">
        Nhớ ra mật khẩu?{' '}
        <Link to="/login" className="text-primary rounded-sm font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
