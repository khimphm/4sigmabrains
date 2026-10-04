import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from './use-auth'

// Chỉ cho vào khi đã đăng nhập và được admin duyệt.
export function RequireAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="text-muted-foreground grid min-h-svh place-items-center text-sm">Đang tải…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.status !== 'ACTIVE') return <Navigate to="/pending" replace />
  return <Outlet />
}
