import { useQueryClient } from '@tanstack/react-query'
import { Check, Clock, Loader2, Lock, LogOut, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { FullPageLoader } from '@/components/full-page-loader'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { homeFor } from '@/features/auth/api'
import { useAuth } from '@/features/auth/use-auth'
import { fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AuthLayout } from './auth-layout'
import { AuthHeading, HeadingIcon } from './auth-ui'

export function PendingPage() {
  const { user, isLoading, logout } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)

  if (isLoading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'ACTIVE') return <Navigate to={homeFor(user)} replace />
  const disabled = user.status === 'DISABLED'

  const recheck = async () => {
    setChecking(true)
    await qc.refetchQueries({ queryKey: ['auth', 'me'] })
    setChecking(false)
    setCheckedAt(new Date())
  }

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const steps = [
    { title: 'Đã gửi yêu cầu', done: true },
    { title: 'Quản trị viên duyệt', done: false, current: true },
    { title: 'Vào không gian làm việc', done: false },
  ]

  return (
    <AuthLayout>
      <AuthHeading
        icon={
          <HeadingIcon tone={disabled ? 'danger' : 'primary'}>
            {disabled ? <Lock strokeWidth={1.8} /> : <Clock strokeWidth={1.8} className="motion-safe:animate-[spin_6s_linear_infinite]" />}
          </HeadingIcon>
        }
        title={disabled ? 'Tài khoản đã bị khoá' : 'Đang chờ duyệt'}
        description={
          disabled
            ? 'Bạn không thể vào hệ thống bằng tài khoản này. Liên hệ quản trị viên nếu bạn nghĩ đây là nhầm lẫn.'
            : 'Tài khoản đã được ghi nhận và quản trị viên đã nhận thông báo. Bạn sẽ vào được hệ thống ngay sau khi được duyệt.'
        }
      />

      <div className="border-border bg-card shadow-card mb-6 flex items-center gap-3 rounded-[10px] border p-3.5">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="text-muted-foreground truncate text-[13px]">{user.email}</div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold',
            disabled ? 'bg-overdue text-overdue-foreground' : 'bg-due-soon text-due-soon-foreground',
          )}
        >
          {disabled ? 'Đã khoá' : 'Chờ duyệt'}
        </span>
      </div>

      {!disabled && (
        <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Tiến trình kích hoạt tài khoản">
          {steps.map((s, i) => (
            <li key={s.title} className="space-y-2">
              <span className={cn('block h-1 rounded-full', s.done ? 'bg-on-time-foreground/70' : s.current ? 'bg-primary motion-safe:animate-pulse' : 'bg-border')} />
              <div className={cn('flex items-start gap-1.5 text-[12px] leading-snug font-semibold', s.done || s.current ? 'text-foreground' : 'text-muted-foreground')}>
                {s.done ? <Check className="text-on-time-foreground mt-px size-3.5 shrink-0" strokeWidth={2.6} /> : <span className="num">{i + 1}.</span>}
                {s.title}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap gap-2.5">
        {!disabled && (
          <Button size="lg" className="h-11 flex-1 cursor-pointer" onClick={recheck} disabled={checking}>
            {checking ? <Loader2 className="animate-spin" /> : <RefreshCw strokeWidth={1.8} />}
            Kiểm tra lại
          </Button>
        )}
        <Button variant="outline" size="lg" className={cn('h-11 cursor-pointer', disabled && 'flex-1')} onClick={signOut}>
          <LogOut strokeWidth={1.8} />
          Đăng xuất
        </Button>
      </div>
      {checkedAt && !disabled && (
        <p className="text-muted-foreground mt-3 text-[13px]" role="status">
          Vẫn đang chờ duyệt · kiểm tra {fromNow(checkedAt)}
        </p>
      )}
    </AuthLayout>
  )
}
