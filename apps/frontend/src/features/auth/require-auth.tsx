import { Navigate, Outlet } from 'react-router-dom'

import { FullPageLoader } from '@/components/full-page-loader'
import { useAuth } from './use-auth'

// Chỉ cho vào khi đã đăng nhập và được admin duyệt.
export function RequireAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.status !== 'ACTIVE') return <Navigate to="/pending" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}
