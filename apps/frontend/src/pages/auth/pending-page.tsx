import { Clock, Lock } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'

export function PendingPage() {
  const { user, isLoading, logout } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'ACTIVE') return <Navigate to="/" replace />
  const disabled = user.status === 'DISABLED'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <BrandLogo className="mb-12" />
      <span className="bg-primary/10 text-primary relative mb-6 grid size-16 place-items-center rounded-2xl">
        {disabled ? <Lock className="size-7" /> : <Clock className="size-7" />}
        {!disabled && <span className="bg-primary/20 absolute inset-0 animate-ping rounded-2xl" />}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{disabled ? 'Tài khoản đã bị khoá' : 'Đang chờ duyệt'}</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {disabled
          ? 'Liên hệ quản trị viên nếu bạn nghĩ đây là nhầm lẫn.'
          : `Tài khoản ${user.email} đã được ghi nhận. Quản trị viên đã nhận thông báo và sẽ duyệt để bạn vào hệ thống.`}
      </p>
      <div className="mt-8 flex gap-2">
        {!disabled && <Button onClick={() => location.reload()}>Kiểm tra lại</Button>}
        <Button variant="outline" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
