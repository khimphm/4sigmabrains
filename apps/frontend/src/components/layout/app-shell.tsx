import { LogOut, Menu, Monitor, Moon, Settings, Sun, UserRound } from 'lucide-react'
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
import { ROLE_LABEL } from '@/lib/constants'
import { useTheme } from '@/lib/theme'
import { CommandPalette } from './command-palette'
import { NotificationBell } from './notification-bell'
import { Sidebar } from './sidebar'
import { TopbarSlotContext } from './topbar-slot'

export function AppShell() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [crumbs, setCrumbs] = useState<HTMLElement | null>(null)
  const [actions, setActions] = useState<HTMLElement | null>(null)
  const openLink = useCallback((link: string) => navigate(link), [navigate])
  useRealtimeNotifications(openLink)

  return (
    <TopbarSlotContext.Provider value={{ crumbs, actions }}>
      <div className="bg-background flex min-h-svh">
        <a
          href="#main"
          className="bg-primary sr-only z-50 rounded-md px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Bỏ qua tới nội dung
        </a>
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
          <Sidebar onSearch={() => setSearchOpen(true)} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 border-none p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Sidebar
              onNavigate={() => setMobileOpen(false)}
              onSearch={() => {
                setMobileOpen(false)
                setSearchOpen(true)
              }}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          <header className="bg-card/90 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu />
            </Button>
            <div ref={setCrumbs} className="min-w-0 flex-1" />
            <div ref={setActions} className="flex shrink-0 items-center gap-2 [&:empty]:hidden" />
            <div className="flex shrink-0 items-center gap-1">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hover:ring-primary/30 focus-visible:ring-ring ml-1 rounded-full ring-2 ring-transparent transition outline-none"
                    aria-label="Tài khoản"
                  >
                    {user && <UserAvatar user={user} className="size-8" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="font-semibold">{user?.name}</div>
                    <div className="text-muted-foreground truncate text-xs">{user?.email}</div>
                    {user && <div className="text-primary mt-1 text-xs font-medium">{ROLE_LABEL[user.role]}</div>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserRound />
                      Hồ sơ cá nhân
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings />
                        Cài đặt hệ thống
                      </Link>
                    </DropdownMenuItem>
                  )}
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
          <main id="main" className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TopbarSlotContext.Provider>
  )
}
