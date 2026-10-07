import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { FullPageLoader } from '@/components/full-page-loader'
import { useAuth } from './use-auth'

// Nhân sự nội bộ: đã đăng nhập, đã được duyệt, không phải tài khoản khách hàng.
export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (user.status !== 'ACTIVE') return <Navigate to="/pending" replace />
  if (user.role === 'CLIENT') return <Navigate to="/portal" replace />
  return <Outlet />
}

// Cổng khách hàng (chủ đầu tư)
export function RequireClient() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.status !== 'ACTIVE') return <Navigate to="/pending" replace />
  if (user.role !== 'CLIENT') return <Navigate to="/" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

export function RequireManager() {
  const { isManager } = useAuth()
  return isManager ? <Outlet /> : <Navigate to="/" replace />
}
