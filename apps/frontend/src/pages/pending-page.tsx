import { Clock } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'

export function PendingPage() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'ACTIVE') return <Navigate to="/" replace />

  const disabled = user.status === 'DISABLED'

  return (
    <div className="bg-sidebar grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="items-center">
          <span className="bg-secondary text-primary mb-2 grid size-12 place-items-center rounded-full">
            <Clock />
          </span>
          <CardTitle>{disabled ? 'Tài khoản đã bị khoá' : 'Đang chờ duyệt'}</CardTitle>
          <CardDescription>
            {disabled
              ? 'Liên hệ quản trị viên nếu bạn nghĩ đây là nhầm lẫn.'
              : `Tài khoản ${user.email} đã được ghi nhận. Quản trị viên sẽ duyệt để bạn vào hệ thống.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={logout}>
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
