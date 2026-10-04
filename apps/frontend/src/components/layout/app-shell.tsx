import { LogOut, Menu, Monitor, Moon, Search, Sun, UserRound } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useRealtimeNotifications } from '@/features/notifications/api'
import { TaskSheet } from '@/features/tasks/task-sheet'
import { ROLE_LABEL } from '@/lib/constants'
import { useTheme } from '@/lib/theme'
import { CommandPalette } from './command-palette'
import { NotificationBell } from './notification-bell'
import { Sidebar } from './sidebar'

export function AppShell() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const openLink = useCallback((link: string) => navigate(link), [navigate])
  useRealtimeNotifications(openLink)

  const isMac = navigator.platform.toLowerCase().includes('mac')

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="border-sidebar-border fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
        <Sidebar />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-none p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur-md md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            <Menu />
          </Button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="bg-muted/60 text-muted-foreground hover:bg-muted flex h-9 w-full max-w-md items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
          >
            <Search className="size-4" />
            <span className="truncate">Tìm kiếm…</span>
            <kbd className="bg-background ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="hover:ring-primary/30 ml-1 rounded-full ring-2 ring-transparent transition" aria-label="Tài khoản">
                  {user && <UserAvatar user={user} className="size-8" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-muted-foreground truncate text-xs">{user?.email}</div>
                  {user && <div className="text-primary mt-1 text-xs">{ROLE_LABEL[user.role]}</div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserRound />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Giao diện</DropdownMenuLabel>
                {(
                  [
                    ['light', 'Sáng', Sun],
                    ['dark', 'Tối', Moon],
                    ['system', 'Theo hệ thống', Monitor],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                    <Icon />
                    {label}
                    {theme === value && <span className="bg-primary ml-auto size-1.5 rounded-full" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} variant="destructive">
                  <LogOut />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <TaskSheet />
    </div>
  )
}
