import { Building2, FolderKanban, LogOut, Mail, Monitor, Moon, Phone, Sun } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { usePortalOverview } from '@/features/portal/api'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const YEAR = new Date().getFullYear()

// Bố cục riêng cho khách hàng / chủ đầu tư: gọn, sáng, không có thanh bên nội bộ
export function PortalLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { data } = usePortalOverview()
  const clientName = data?.client?.name ?? user?.client?.name
  const company = data?.company

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <a
        href="#portal-main"
        className="bg-primary sr-only z-50 rounded-md px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Bỏ qua tới nội dung
      </a>
      <header className="bg-card/90 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 md:px-8">
          <Link to="/portal" className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <BrandLogo className="text-[15px]" />
            {clientName && (
              <>
                <span className="bg-border hidden h-6 w-px sm:block" aria-hidden />
                <span className="text-text-secondary hidden min-w-0 items-center gap-1.5 truncate text-sm font-semibold sm:flex">
                  <Building2 className="size-4 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{clientName}</span>
                </span>
              </>
            )}
          </Link>
          <nav className="ml-auto flex items-center gap-1" aria-label="Điều hướng cổng khách hàng">
            <NavLink
              to="/portal"
              end={false}
              className={({ isActive }) =>
                cn(
                  'hidden h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors duration-150 sm:flex',
                  isActive ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-subtle hover:text-foreground',
                )
              }
            >
              <FolderKanban className="size-4" strokeWidth={1.8} />
              Dự án của tôi
            </NavLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Tài khoản"
                  className="hover:bg-subtle focus-visible:ring-ring/50 ml-1 flex cursor-pointer items-center gap-2 rounded-full p-0.5 pr-0.5 transition-colors outline-none focus-visible:ring-[3px] md:pr-3"
                >
                  {user && <UserAvatar user={user} className="size-8" />}
                  <span className="hidden max-w-[160px] truncate text-sm font-semibold md:block">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-muted-foreground truncate text-xs">{user?.email}</div>
                  {clientName && <div className="text-primary mt-1 truncate text-xs font-medium">{clientName}</div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden" onClick={() => navigate('/portal')}>
                  <FolderKanban />
                  Dự án của tôi
                </DropdownMenuItem>
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
                <DropdownMenuItem variant="destructive" onClick={() => logout().then(() => navigate('/login'))}>
                  <LogOut />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <main id="portal-main" className="min-w-0 flex-1">
        <Outlet />
      </main>

      <footer className="bg-card border-t">
        <div className="text-text-secondary mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-6 text-[13px] md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <div className="text-foreground font-semibold">{company?.name || '4SigmaBrains'}</div>
            <div className="mt-0.5">Cổng thông tin dự án dành cho khách hàng · Thông tin chỉ mang tính cập nhật tiến độ.</div>
            {company?.address && <div className="mt-0.5">{company.address}</div>}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {company?.phone && (
              <a href={`tel:${company.phone}`} className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
                <Phone className="size-3.5" strokeWidth={1.8} />
                {company.phone}
              </a>
            )}
            {company?.email && (
              <a href={`mailto:${company.email}`} className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
                <Mail className="size-3.5" strokeWidth={1.8} />
                {company.email}
              </a>
            )}
            <span>© {YEAR} {company?.shortName || '4SigmaBrains'}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
