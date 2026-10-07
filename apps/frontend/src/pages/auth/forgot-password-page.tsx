import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthProviders, useForgotPassword } from '@/features/auth/api'
import { errorMessage } from '@/lib/api'
import { AuthLayout } from './auth-layout'
import { AuthHeading, Field, FormAlert, HeadingIcon } from './auth-ui'

function BackToLogin() {
  return (
    <Link
      to="/login"
      className="text-text-secondary hover:text-foreground focus-visible:ring-ring/50 mt-7 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]"
    >
      <ArrowLeft className="size-4" strokeWidth={1.8} />
      Quay lại đăng nhập
    </Link>
  )
}

export function ForgotPasswordPage() {
  const [params] = useSearchParams()
  const providers = useAuthProviders()
  const forgot = useForgotPassword()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mailOff = providers.data && !providers.data.emailEnabled

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    forgot.mutate(email.trim(), {
      onSuccess: () => setSentTo(email.trim()),
      onError: (err) => setError(errorMessage(err)),
    })
  }

  if (sentTo)
    return (
      <AuthLayout>
        <AuthHeading
          icon={
            <HeadingIcon tone="success">
              <MailCheck strokeWidth={1.8} />
            </HeadingIcon>
          }
          title="Kiểm tra hộp thư"
          description={
            <>
              Nếu <span className="text-foreground font-semibold break-all">{sentTo}</span> có tài khoản, chúng tôi đã gửi liên kết đặt mật khẩu mới. Liên kết có hiệu lực trong 1 giờ.
            </>
          }
        />
        {mailOff && (
          <FormAlert tone="info">
            Hệ thống chưa cấu hình gửi email. Hãy liên hệ quản trị viên để nhận liên kết đặt lại mật khẩu.
          </FormAlert>
        )}
        <ul className="text-text-secondary border-border bg-subtle/60 space-y-1.5 rounded-[10px] border p-4 text-[13px] leading-relaxed">
          <li>Không thấy email? Kiểm tra thư mục Spam hoặc Quảng cáo.</li>
          <li>Đăng nhập bằng Google thì không cần mật khẩu.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="h-11 cursor-pointer"
            disabled={forgot.isPending}
            onClick={() => forgot.mutate(sentTo)}
          >
            {forgot.isPending && <Loader2 className="animate-spin" />}
            Gửi lại
          </Button>
          <Button variant="ghost" size="lg" className="h-11 cursor-pointer" onClick={() => setSentTo(null)}>
            Dùng email khác
          </Button>
        </div>
        <BackToLogin />
      </AuthLayout>
    )

  return (
    <AuthLayout>
      <AuthHeading
        icon={
          <HeadingIcon>
            <KeyRound strokeWidth={1.8} />
          </HeadingIcon>
        }
        title="Quên mật khẩu"
        description="Nhập email tài khoản. Chúng tôi sẽ gửi liên kết để bạn đặt mật khẩu mới."
      />
      {error && <FormAlert>{error}</FormAlert>}
      {mailOff && (
        <FormAlert tone="info">Hệ thống hiện chưa gửi được email. Nếu không nhận được liên kết, hãy liên hệ quản trị viên.</FormAlert>
      )}
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="ten@congty.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" className="h-11 w-full cursor-pointer text-[15px]" disabled={forgot.isPending}>
          {forgot.isPending && <Loader2 className="animate-spin" />}
          {forgot.isPending ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
        </Button>
      </form>
      <BackToLogin />
    </AuthLayout>
  )
}
