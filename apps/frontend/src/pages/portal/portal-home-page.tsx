import { ArrowRight, CalendarDays, CheckCircle2, Clock3, FolderOpen, Layers, TrendingUp } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { Pill } from '@/components/pill'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/use-auth'
import { progressOf, usePortalOverview, type PortalProjectSummary } from '@/features/portal/api'
import { fmtDate, fromNow } from '@/lib/format'
import { ProgressBar, ProjectStatusPill } from './parts'

export function PortalHomePage() {
  const { user } = useAuth()
  const { data, isLoading } = usePortalOverview()
  const projects = data?.projects ?? []
  const total = projects.reduce((s, p) => s + p.total, 0)
  const done = projects.reduce((s, p) => s + p.done, 0)
  const active = projects.filter((p) => p.status === 'ACTIVE').length

  useEffect(() => {
    document.title = 'Dự án của tôi · 4SigmaBrains'
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
      <section className="bg-card shadow-card relative overflow-hidden rounded-[14px] border px-5 py-7 md:px-8 md:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,var(--color-primary)_0%,transparent_70%)] opacity-[0.12]"
        />
        <div className="relative">
          <p className="text-primary text-sm font-semibold">{data?.client?.name ?? user?.client?.name ?? 'Cổng khách hàng'}</p>
          <h1 className="mt-1 text-[26px] leading-tight font-extrabold tracking-tight md:text-[30px]">Xin chào, {user?.name}</h1>
          <p className="text-text-secondary mt-2 max-w-2xl text-[15px]">
            Theo dõi tiến độ, các mốc đã hoàn thành và tài liệu được chia sẻ cho từng dự án. Số liệu được cập nhật trực tiếp từ đội ngũ thực hiện.
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
            <Summary icon={<Layers className="size-4" strokeWidth={1.8} />} label="Dự án" value={isLoading ? '—' : projects.length} />
            <Summary icon={<TrendingUp className="size-4" strokeWidth={1.8} />} label="Đang triển khai" value={isLoading ? '—' : active} />
            <Summary
              icon={<CheckCircle2 className="size-4" strokeWidth={1.8} />}
              label="Tiến độ chung"
              value={isLoading ? '—' : `${progressOf(done, total)}%`}
            />
          </dl>
        </div>
      </section>

      <div className="mt-8 flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">Dự án của tôi</h2>
        {!isLoading && projects.length > 0 && <span className="text-muted-foreground text-sm">{projects.length} dự án</span>}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[232px] rounded-[12px]" />)
          : projects.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
      {!isLoading && projects.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="Chưa có dự án nào được chia sẻ"
          description="Khi đội ngũ bắt đầu dự án cho đơn vị của bạn, tiến độ sẽ hiển thị tại đây."
          className="bg-card mt-2"
        />
      )}
    </div>
  )
}

function Summary({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="bg-subtle rounded-lg border px-3 py-3 sm:px-4">
      <dt className="text-text-secondary flex items-center gap-1.5 text-[12px] font-semibold sm:text-[13px]">
        {icon}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="num mt-1 text-2xl font-extrabold tracking-tight">{value}</dd>
    </div>
  )
}

function ProjectCard({ p }: { p: PortalProjectSummary }) {
  const pct = progressOf(p.done, p.total)
  return (
    <Link
      to={`/portal/projects/${p.id}`}
      className="group bg-card shadow-card hover:border-primary/40 focus-visible:ring-ring/50 relative flex flex-col overflow-hidden rounded-[12px] border p-5 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] motion-reduce:hover:translate-y-0"
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs font-semibold tracking-wide">{p.key}</div>
          <h3 className="mt-0.5 line-clamp-2 text-[17px] leading-snug font-bold">{p.name}</h3>
        </div>
        <ProjectStatusPill status={p.status} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-text-secondary text-[13px] font-semibold">Tiến độ</span>
          <span className="num text-lg font-extrabold">{pct}%</span>
        </div>
        <ProgressBar value={pct} color={p.color} />
        <div className="text-muted-foreground mt-2 text-[13px]">
          {p.total ? `${p.done} trên ${p.total} hạng mục hoàn thành` : 'Đang lên kế hoạch hạng mục'}
        </div>
      </div>

      <div className="text-text-secondary mt-auto space-y-1.5 border-t pt-4 text-[13px]" style={{ marginTop: 20 }}>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" strokeWidth={1.8} />
          {p.dueDate ? `Dự kiến bàn giao ${fmtDate(p.dueDate)}` : 'Chưa chốt ngày bàn giao'}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 shrink-0" strokeWidth={1.8} />
          {p.lastCompletedAt ? `Cập nhật ${fromNow(p.lastCompletedAt)}` : 'Chưa có hạng mục hoàn thành'}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        {p.overdue > 0 ? <Pill tone="due-soon">{p.overdue} hạng mục đang chậm</Pill> : <Pill tone="on-time">Đúng tiến độ</Pill>}
        <span className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
          Xem chi tiết
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.8} />
        </span>
      </div>
    </Link>
  )
}
