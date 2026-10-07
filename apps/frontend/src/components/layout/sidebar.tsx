import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Bell,
  Building2,
  CheckSquare,
  Database,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  MessagesSquare,
  Plus,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { BrandMark } from '@/components/brand-logo'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useNotifications } from '@/features/notifications/api'
import { useProjects } from '@/features/projects/api'
import { get } from '@/lib/api'
import { ROLE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DashboardData } from '@/types/api'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  count?: number
  urgent?: boolean
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-150',
    'focus-visible:ring-sidebar-ring outline-none focus-visible:ring-2',
    isActive
      ? 'bg-sidebar-accent text-white'
      : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white',
  )

function NavItem({ item, onNavigate }: { item: Item; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={itemClass} onClick={onNavigate}>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
      <span className="truncate">{item.label}</span>
      {!!item.count && (
        <span
          className={cn(
            'num ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold',
            item.urgent ? 'bg-seal text-white' : 'bg-white/10 text-white/80',
          )}
        >
          {item.count > 99 ? '99+' : item.count}
        </span>
      )}
    </NavLink>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-sidebar-muted mb-1.5 flex items-center justify-between px-2.5 text-[11px] font-semibold tracking-wider uppercase">
        {title}
        {action}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

export function Sidebar({ onNavigate, onSearch }: { onNavigate?: () => void; onSearch?: () => void }) {
  const { user, isAdmin, isManager } = useAuth()
  const { data: projects = [] } = useProjects()
  const { data: notifications } = useNotifications()
  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => get<DashboardData>('/dashboard'),
    staleTime: 60_000,
  })
  const active = projects.filter((p) => p.status === 'ACTIVE').slice(0, 6)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  const main: Item[] = [
    { to: '/', label: 'Bảng làm việc', icon: LayoutDashboard, end: true },
    { to: '/my-tasks', label: 'Việc của tôi', icon: CheckSquare, count: dash?.me.open, urgent: !!dash?.me.overdue },
    { to: '/notifications', label: 'Thông báo', icon: Bell, count: notifications?.unread },
  ]
  const collab: Item[] = [
    { to: '/decisions', label: 'Phân tích và chốt', icon: Gavel, count: dash?.openDecisions },
    { to: '/discussions', label: 'Thảo luận', icon: MessagesSquare },
    { to: '/files', label: 'Tệp và bản vẽ', icon: FolderOpen },
    { to: '/dataset', label: 'Dataset bản vẽ', icon: Database },
    { to: '/members', label: 'Thành viên', icon: Users },
  ]
  const manage: Item[] = [
    { to: '/clients', label: 'Khách hàng', icon: Building2 },
    { to: '/reports', label: 'Báo cáo', icon: BarChart3 },
  ]

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <BrandMark />
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-white">4SigmaBrains</span>
          <span className="text-sidebar-muted block text-xs">Workspace nội bộ</span>
        </span>
      </Link>

      <div className="px-3">
        <button
          type="button"
          onClick={onSearch}
          className="bg-sidebar-field border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground flex h-9 w-full items-center gap-2 rounded-md border px-2.5 text-sm transition-colors"
        >
          <Search className="size-4" strokeWidth={1.8} aria-hidden />
          Tìm nhanh
          <kbd className="ml-auto rounded border border-white/10 px-1.5 font-sans text-[11px]">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
      </div>

      <nav className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="Điều hướng chính">
        <div className="flex flex-col gap-0.5">
          {main.map((i) => (
            <NavItem key={i.to} item={i} onNavigate={onNavigate} />
          ))}
        </div>

        <Section
          title="Dự án"
          action={
            isManager && (
              <Link
                to="/projects?new=1"
                onClick={onNavigate}
                className="hover:text-white"
                aria-label="Tạo dự án"
                title="Tạo dự án"
              >
                <Plus className="size-4" />
              </Link>
            )
          }
        >
          {active.map((p) => (
            <NavLink key={p.id} to={`/projects/${p.id}`} className={itemClass} onClick={onNavigate}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
          <NavLink to="/projects" end className={itemClass} onClick={onNavigate}>
            <span className="text-sidebar-muted pl-5 text-[13px]">Tất cả dự án</span>
          </NavLink>
        </Section>

        <Section title="Cộng tác">
          {collab.map((i) => (
            <NavItem key={i.to} item={i} onNavigate={onNavigate} />
          ))}
        </Section>

        <Section title="Quản lý">
          {manage.map((i) => (
            <NavItem key={i.to} item={i} onNavigate={onNavigate} />
          ))}
        </Section>
      </nav>

      <div className="border-sidebar-border border-t px-3 py-3">
        {isAdmin && <NavItem item={{ to: '/settings', label: 'Cài đặt', icon: Settings }} onNavigate={onNavigate} />}
        {user && (
          <Link
            to="/profile"
            onClick={onNavigate}
            className="hover:bg-sidebar-accent/60 mt-1 flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors"
          >
            <UserAvatar user={user} className="size-8" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="text-sidebar-muted block truncate text-xs">{user.title || ROLE_LABEL[user.role]}</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
