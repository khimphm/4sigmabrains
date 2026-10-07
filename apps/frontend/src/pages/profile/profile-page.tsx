import { Building2, CalendarDays, Mail, PencilLine, Phone } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { ROLE_LABEL, USER_STATUS_LABEL } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'
import { InfoTab } from './info-tab'
import { NotificationsTab } from './notifications-tab'
import { OverviewTab } from './overview-tab'
import { PROVIDER_LABEL } from './parts'
import { SecurityTab } from './security-tab'

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'info', label: 'Thông tin và nghề nghiệp' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'notifications', label: 'Thông báo' },
] as const
type TabId = (typeof TABS)[number]['id']

export function ProfilePage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'overview'

  // Kết quả trả về từ luồng liên kết Google / Microsoft / GitHub
  useEffect(() => {
    const linked = params.get('linked')
    const error = params.get('error')
    if (!linked && !error) return
    if (linked) toast.success(`Đã liên kết tài khoản ${PROVIDER_LABEL[linked as keyof typeof PROVIDER_LABEL] ?? linked}`)
    if (error) toast.error(error)
    const next = new URLSearchParams(params)
    next.delete('linked')
    next.delete('error')
    setParams(next, { replace: true })
  }, [params, setParams])

  const go = (id: TabId) => {
    const next = new URLSearchParams(params)
    if (id === 'overview') next.delete('tab')
    else next.set('tab', id)
    setParams(next)
  }

  if (!user) return null

  return (
    <>
      <PageTopbar crumbs={[{ label: 'Hồ sơ cá nhân', to: '/profile' }, { label: TABS.find((t) => t.id === tab)!.label }]} title="Hồ sơ cá nhân" />
      <PageContainer>
        <ProfileHeader user={user} tab={tab} onTab={go} />
        <div className="mt-6">
          {tab === 'overview' && <OverviewTab user={user} />}
          {tab === 'info' && <InfoTab key={user.updatedAt} user={user} />}
          {tab === 'security' && <SecurityTab user={user} />}
          {tab === 'notifications' && <NotificationsTab user={user} />}
        </div>
      </PageContainer>
    </>
  )
}

function ProfileHeader({ user, tab, onTab }: { user: User; tab: TabId; onTab: (t: TabId) => void }) {
  const meta = [
    user.title && { icon: null, text: user.title },
    user.department && { icon: Building2, text: user.department },
    { icon: CalendarDays, text: `Tham gia từ ${fmtDate(user.createdAt, 'MM/yyyy')}` },
    { icon: Mail, text: user.email },
    user.phone && { icon: Phone, text: user.phone },
  ].filter(Boolean) as { icon: typeof Mail | null; text: string }[]

  return (
    <section className="bg-card shadow-card relative overflow-hidden rounded-[10px] border">
      {/* Dải nền nhẹ phía trên tạo chiều sâu cho thẻ hồ sơ */}
      <div
        aria-hidden
        className="from-primary-soft pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-70"
      />
      <div className="relative flex flex-col gap-5 px-5 pt-6 md:flex-row md:items-center md:px-6">
        <UserAvatar user={user} className="ring-card size-[72px] shrink-0 ring-4 [&_[data-slot=avatar-fallback]]:text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight md:text-[28px]">{user.name}</h1>
            <Pill tone={user.status === 'ACTIVE' ? 'on-time' : 'neutral'}>{USER_STATUS_LABEL[user.status]}</Pill>
            <Pill tone="primary">{ROLE_LABEL[user.role]}</Pill>
          </div>
          <ul className="text-text-secondary mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            {meta.map((m, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1.5">
                {m.icon && <m.icon className="size-4 shrink-0 opacity-70" strokeWidth={1.8} aria-hidden />}
                <span className="truncate">{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
        {tab !== 'info' && (
          <Button variant="outline" asChild className="self-start md:self-center">
            <Link to="/profile?tab=info">
              <PencilLine strokeWidth={1.8} />
              Chỉnh sửa hồ sơ
            </Link>
          </Button>
        )}
      </div>
      <nav aria-label="Mục hồ sơ" className="relative mt-5 overflow-x-auto px-3 pb-3 md:px-4">
        <div role="tablist" className="flex w-max gap-1">
          {TABS.map((t) => {
            const active = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTab(t.id)}
                className={cn(
                  'focus-visible:ring-ring/50 h-9 cursor-pointer rounded-md px-3.5 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                  active ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-subtle hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </section>
  )
}
