import { ArrowRight, CheckCircle2, LogIn, Plus, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { DeadlineBadge, Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PROVIDER_LABEL, useLoginMethods, useSaveProfile, useUserProfile, type OAuthProvider } from '@/features/profile/api'
import { errorMessage } from '@/lib/api'
import { STATUS_META } from '@/lib/constants'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { User } from '@/types/api'
import { ProviderTile, SectionCard, ToggleRow } from './parts'

export function OverviewTab({ user }: { user: User }) {
  const { data, isLoading } = useUserProfile(user.id)
  const s = data?.stats
  const diff = s ? s.done30 - s.donePrev30 : 0

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {isLoading || !s ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[112px] rounded-[10px]" />)
          ) : (
            <>
              <Stat
                label="Hoàn thành 30 ngày"
                value={s.done30}
                hint={diff === 0 ? 'Bằng tháng trước' : `${diff > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(diff)} so với tháng trước`}
              />
              <Stat
                label="Tỷ lệ đúng hạn"
                value={s.onTimeRate == null ? '—' : `${s.onTimeRate}%`}
                valueClass={s.onTimeRate != null && s.onTimeRate >= 80 ? 'text-on-time-foreground' : undefined}
                hint={s.onTime + s.late ? `${s.onTime} trên ${s.onTime + s.late} việc` : 'Chưa có việc có hạn'}
              />
              <Stat label="Đang làm" value={s.open} hint="Việc chưa hoàn thành" />
              <Stat
                label="Quá hạn"
                value={s.overdue}
                valueClass={s.overdue ? 'text-overdue-foreground' : undefined}
                hint={s.overdue ? 'Cần xử lý sớm' : 'Không có việc quá hạn'}
              />
            </>
          )}
        </div>

        <SectionCard
          title="Việc đang làm"
          action={
            <Link to="/my-tasks" className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline">
              Xem tất cả
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Link>
          }
          bodyClassName="pt-2"
        >
          {isLoading ? (
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !data?.openTasks.length ? (
            <EmptyState icon={CheckCircle2} title="Không có việc đang mở" description="Bạn đã hoàn thành hết việc được giao." className="mt-2 py-10" />
          ) : (
            <ul className="divide-border divide-y">
              {data.openTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tasks/${t.id}`}
                    className="hover:bg-subtle -mx-3 flex items-center gap-3 rounded-md px-3 py-3 transition-colors duration-150"
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', STATUS_META[t.status].dot)} title={STATUS_META[t.status].label} />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[15px] font-semibold sm:truncate">{t.title}</div>
                      <div className="text-text-secondary mt-0.5 flex items-center gap-1.5 text-[13px]">
                        <span className="size-2 rounded-sm" style={{ background: t.projectColor }} aria-hidden />
                        <span className="truncate">
                          {t.projectName} · {t.projectKey}-{t.number} · {STATUS_META[t.status].label}
                        </span>
                      </div>
                    </div>
                    <DeadlineBadge due={t.dueDate} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Kỹ năng và chuyên môn"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile?tab=info">
                <Plus strokeWidth={1.8} />
                Thêm
              </Link>
            </Button>
          }
        >
          {user.skills.length ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s) => (
                <span key={s} className="border-border-strong rounded-full border px-3.5 py-1.5 text-sm font-semibold">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary flex items-center gap-2 text-sm">
              <Sparkles className="size-4" strokeWidth={1.8} />
              Chưa có kỹ năng nào. Thêm kỹ năng để đồng đội biết nên hỏi bạn việc gì.
            </p>
          )}
        </SectionCard>
      </div>

      <aside className="min-w-0 space-y-6">
        <LinkedSummary />
        <NotifySummary user={user} />
        <SecuritySummary user={user} />
      </aside>
    </div>
  )
}

function Stat({ label, value, hint, valueClass }: { label: string; value: ReactNode; hint: string; valueClass?: string }) {
  return (
    <div className="bg-card shadow-card rounded-[10px] border p-4">
      <div className="text-text-secondary text-[13px] font-semibold">{label}</div>
      <div className={cn('num mt-1.5 text-[32px] leading-none font-extrabold tracking-tight', valueClass)}>{value}</div>
      <div className="text-muted-foreground mt-2 text-[13px] leading-snug">{hint}</div>
    </div>
  )
}

function LinkedSummary() {
  const { data, isLoading } = useLoginMethods()
  return (
    <SectionCard title="Tài khoản liên kết" bodyClassName="pt-2">
      {isLoading || !data ? (
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {(['google', 'microsoft', 'github'] as OAuthProvider[]).map((p) => (
            <li key={p} className="flex items-center gap-3 py-3">
              <ProviderTile provider={p} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{PROVIDER_LABEL[p]}</div>
                <div className="text-text-secondary truncate text-[13px]">{data.linked[p] ? data.email : 'Chưa liên kết'}</div>
              </div>
              {data.linked[p] ? (
                <Pill tone="on-time">Đã liên kết</Pill>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/profile?tab=security">Liên kết</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function NotifySummary({ user }: { user: User }) {
  const save = useSaveProfile()
  const set = (patch: Partial<User>) =>
    save.mutate(patch, { onSuccess: () => toast.success('Đã lưu cài đặt thông báo'), onError: (e) => toast.error(errorMessage(e)) })
  const both = user.remind24h || user.remind2h
  return (
    <SectionCard title="Nhận thông báo" bodyClassName="pt-1">
      <div className="divide-border divide-y">
        <ToggleRow id="ov-web" label="Trong web" description="Chuông thông báo và danh sách" checked={user.webNotifications} onChange={(v) => set({ webNotifications: v })} />
        <ToggleRow id="ov-email" label="Email" description="Nhắc hạn, giao việc, nhắc tên" checked={user.emailNotifications} onChange={(v) => set({ emailNotifications: v })} />
        <ToggleRow id="ov-zalo" label="Zalo" description="Chưa kết nối" checked={false} disabled badge={<Pill>Sắp có</Pill>} />
        <ToggleRow
          id="ov-remind"
          label="Nhắc trước hạn"
          description={both ? [user.remind24h && '24 giờ', user.remind2h && '2 giờ'].filter(Boolean).join(' và ') : 'Đang tắt'}
          checked={both}
          onChange={(v) => set({ remind24h: v, remind2h: v })}
        />
      </div>
    </SectionCard>
  )
}

function SecuritySummary({ user }: { user: User }) {
  return (
    <SectionCard title="Bảo mật" icon={<ShieldCheck className="size-[18px]" strokeWidth={1.8} />}>
      {user.totpEnabled ? (
        <div className="bg-on-time text-on-time-foreground flex items-center gap-3 rounded-lg p-3.5">
          <ShieldCheck className="size-5 shrink-0" strokeWidth={1.8} />
          <div className="text-sm">
            <div className="font-semibold">Đã bật xác thực 2 lớp</div>
            <div className="opacity-90">Tài khoản được bảo vệ bằng mã từ ứng dụng.</div>
          </div>
        </div>
      ) : (
        <div className="bg-due-soon text-due-soon-foreground flex items-center gap-3 rounded-lg p-3.5">
          <ShieldAlert className="size-5 shrink-0" strokeWidth={1.8} />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">Xác thực 2 lớp</div>
            <div className="opacity-90">Chưa bật, nên bật để bảo vệ bản vẽ khách hàng.</div>
          </div>
          <Button size="sm" asChild>
            <Link to="/profile?tab=security">Bật</Link>
          </Button>
        </div>
      )}
      <p className="text-text-secondary mt-3 flex items-center gap-1.5 text-[13px]">
        <LogIn className="size-4 shrink-0" strokeWidth={1.8} />
        Đăng nhập gần nhất: {user.lastLoginAt ? fmtDateTime(user.lastLoginAt) : 'chưa ghi nhận'}
      </p>
    </SectionCard>
  )
}
