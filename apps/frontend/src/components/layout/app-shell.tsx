import { CheckSquare, FolderKanban, LayoutDashboard, LogOut, MessagesSquare } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/my-tasks', label: 'Việc của tôi', icon: CheckSquare },
  { to: '/projects', label: 'Dự án', icon: FolderKanban },
  { to: '/discussions', label: 'Thảo luận', icon: MessagesSquare },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-svh">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r md:flex">
        <BrandLogo className="px-5 py-5 text-white" />
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="border-sidebar-border flex items-center gap-3 border-t px-4 py-4">
            <Avatar>
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-sidebar-accent text-xs text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-white"
              onClick={logout}
              aria-label="Đăng xuất"
            >
              <LogOut />
            </Button>
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
