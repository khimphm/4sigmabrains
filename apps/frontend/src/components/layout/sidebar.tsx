import {
  CheckSquare,
  Database,
  FolderKanban,
  Gavel,
  LayoutDashboard,
  MessagesSquare,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { useAuth } from '@/features/auth/use-auth'
import { useProjects } from '@/features/projects/api'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/my-tasks', label: 'Việc của tôi', icon: CheckSquare },
  { to: '/projects', label: 'Dự án', icon: FolderKanban, end: true },
  { to: '/discussions', label: 'Thảo luận', icon: MessagesSquare },
  { to: '/decisions', label: 'Phân tích & quyết định', icon: Gavel },
]

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_4px_14px_-4px_rgba(31,79,209,0.7)]'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  )

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin, isManager } = useAuth()
  const { data: projects = [] } = useProjects()
  const active = projects.filter((p) => p.status === 'ACTIVE').slice(0, 8)

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <BrandLogo className="px-5 py-5 text-white" />

      <nav className="flex flex-col gap-0.5 px-3" onClick={onNavigate}>
        {mainNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={itemClass}>
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 flex items-center justify-between px-6 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
        Dự án đang chạy
        {isManager && (
          <NavLink to="/projects?new=1" onClick={onNavigate} className="hover:text-white" aria-label="Tạo dự án">
            <Plus className="size-3.5" />
          </NavLink>
        )}
      </div>
      <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3" onClick={onNavigate}>
        {active.map((p) => (
          <NavLink key={p.id} to={`/projects/${p.id}`} className={itemClass}>
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />
            <span className="truncate">{p.name}</span>
          </NavLink>
        ))}
        {!active.length && <p className="px-3 py-1 text-xs text-white/30">Chưa có dự án</p>}
      </nav>

      <nav className="border-sidebar-border flex flex-col gap-0.5 border-t px-3 py-3" onClick={onNavigate}>
        <NavLink to="/dataset" className={itemClass}>
          <Database className="size-4" />
          Dataset bản vẽ
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">Sắp có</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin/members" className={itemClass}>
            <ShieldCheck className="size-4" />
            Quản trị thành viên
          </NavLink>
        )}
      </nav>
    </div>
  )
}
