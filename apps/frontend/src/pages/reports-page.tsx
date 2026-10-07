import { format } from 'date-fns'
import { ArrowDown, ArrowUp, BarChart3, Download, Loader2, Tag } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { ProjectDot, SectionCard } from '@/features/dashboard/section-card'
import { useProjects } from '@/features/projects/api'
import { REPORT_RANGES, useReport, type ReportData } from '@/features/reports/api'
import { downloadCsv, reportToCsv } from '@/features/reports/csv'
import { ChartLegend, InlineBar, WeeklyChart } from '@/features/reports/weekly-chart'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const ALL = 'all'

function rateTone(rate: number | null) {
  if (rate === null) return 'neutral' as const
  return rate >= 80 ? ('on-time' as const) : rate >= 60 ? ('due-soon' as const) : ('overdue' as const)
}

function RatePill({ rate }: { rate: number | null }) {
  return (
    <Pill tone={rateTone(rate)} className="num" title={rate === null ? 'Chưa có việc có hạn hoàn thành' : undefined}>
      {rate === null ? 'Chưa có' : `${rate}%`}
    </Pill>
  )
}

export function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const days = Number(params.get('days')) || 30
  const projectId = params.get('projectId') ?? undefined
  const { data, isLoading, isFetching } = useReport(days, projectId)
  const { data: projects = [] } = useProjects()
  const scopeName = projectId ? (projects.find((p) => p.id === projectId)?.name ?? 'Một dự án') : 'Tất cả dự án'
  const rangeLabel = REPORT_RANGES.find((r) => r.days === days)?.label ?? `${days} ngày`

  const setParam = (k: string, v: string | null) =>
    setParams(
      (p) => {
        if (v === null) p.delete(k)
        else p.set(k, v)
        return p
      },
      { replace: true },
    )

  const exportCsv = () => {
    if (!data) return
    downloadCsv(reportToCsv(data, scopeName), `bao-cao-${days}-ngay-${format(new Date(), 'yyyyMMdd')}.csv`)
    toast.success('Đã xuất báo cáo CSV')
  }

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: 'Báo cáo' }]}
        actions={
          <Button onClick={exportCsv} disabled={!data}>
            <Download /> Xuất CSV
          </Button>
        }
      />
      <PageHeader
        title="Báo cáo hiệu suất"
        description={`Đúng hạn, trễ hạn và khối lượng việc trong ${rangeLabel} gần nhất · ${scopeName}`}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <span className="text-text-secondary block text-[13px] font-semibold" id="range-label">
              Khoảng thời gian
            </span>
            <div role="radiogroup" aria-labelledby="range-label" className="bg-subtle inline-flex rounded-md border p-0.5">
              {REPORT_RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  role="radio"
                  aria-checked={days === r.days}
                  onClick={() => setParam('days', r.days === 30 ? null : String(r.days))}
                  className={cn(
                    'focus-visible:ring-ring/50 h-8 cursor-pointer rounded-[5px] px-3 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                    days === r.days ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full space-y-1.5 sm:w-64">
            <Label htmlFor="report-project" className="text-text-secondary text-[13px]">
              Dự án
            </Label>
            <Select value={projectId ?? ALL} onValueChange={(v) => setParam('projectId', v === ALL ? null : v)}>
              <SelectTrigger id="report-project" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả dự án</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <ProjectDot color={p.color} /> {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFetching && !isLoading && (
            <span className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 text-[13px]" role="status">
              <Loader2 className="size-3.5 animate-spin" /> Đang cập nhật…
            </span>
          )}
        </div>
      </PageHeader>

      {isLoading || !data ? <ReportSkeleton /> : <ReportBody data={data} rangeLabel={rangeLabel} />}
    </PageContainer>
  )
}

function ReportBody({ data, rangeLabel }: { data: ReportData; rangeLabel: string }) {
  const s = data.summary
  const finished = s.onTime + s.late
  const maxLabel = Math.max(1, ...data.labels.map((l) => l.total))
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Hoàn thành" value={s.done} tone="primary" hint={`Trong ${rangeLabel}`} />
        <StatCard
          label="Tỉ lệ đúng hạn"
          value={s.rate === null ? '—' : `${s.rate}%`}
          tone={s.rate === null ? 'default' : s.rate >= 80 ? 'success' : s.rate >= 60 ? 'warning' : 'danger'}
          hint={finished ? `${s.onTime} trên ${finished} việc có hạn` : 'Chưa có việc có hạn'}
        />
        <StatCard label="Trễ hạn" value={s.late} tone={s.late ? 'late' : 'default'} hint="Xong sau hạn chót" />
        <StatCard label="Đang quá hạn" value={s.overdue} tone={s.overdue ? 'danger' : 'default'} hint={`${s.open} việc đang mở`} />
        <StatCard label="Việc mới tạo" value={s.created} hint={`Trong ${rangeLabel}`} className="col-span-2 md:col-span-1" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          id="weekly"
          title="Việc hoàn thành theo tuần"
          aside={<span className="hidden sm:inline">12 tuần gần nhất</span>}
        >
          <ChartLegend
            className="mb-4"
            items={[
              { label: 'Đúng hạn / không có hạn', className: 'bg-on-time-foreground' },
              { label: 'Trễ hạn', className: 'bg-late-foreground' },
            ]}
          />
          <WeeklyChart weeks={data.weekly} />
        </SectionCard>

        <SectionCard id="labels" title="Theo nhãn" aside={<span>{data.labels.length} nhãn</span>}>
          {data.labels.length ? (
            <>
              <ChartLegend
                className="mb-4"
                items={[
                  { label: 'Tổng việc', className: 'bg-primary' },
                  { label: 'Đang quá hạn', className: 'bg-overdue-foreground' },
                ]}
              />
              <ul className="space-y-3">
                {data.labels.map((l) => (
                  <li key={l.label} title={`${l.label}: ${l.total} việc, ${l.overdue} đang quá hạn`}>
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                        <Tag className="text-muted-foreground size-3.5 shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{l.label}</span>
                      </span>
                      <span className="text-muted-foreground num shrink-0">
                        {l.total} việc
                        {l.overdue > 0 && <span className="text-overdue-foreground font-semibold"> · {l.overdue} quá hạn</span>}
                      </span>
                    </div>
                    <div className="bg-subtle mt-1.5 flex h-1.5 overflow-hidden rounded-full" aria-hidden>
                      <span className="bg-primary h-full" style={{ width: `${((l.total - l.overdue) / maxLabel) * 100}%` }} />
                      <span className="bg-overdue-foreground h-full" style={{ width: `${(l.overdue / maxLabel) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-[13px]">Chưa có việc nào được gắn nhãn</p>
          )}
        </SectionCard>
      </div>

      <MembersTable members={data.members} />
      <ProjectsTable projects={data.projects} />
    </div>
  )
}

type MemberKey = 'name' | 'done' | 'rate' | 'late' | 'overdue' | 'open' | 'avgLateHours'

function SortHeader({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: MemberKey
  sort: { key: MemberKey; desc: boolean }
  onSort: (k: MemberKey) => void
  children: ReactNode
  className?: string
}) {
  const active = sort.key === k
  return (
    <th scope="col" aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'} className={cn('px-3 py-2.5 font-semibold', className)}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          'hover:text-foreground focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1 rounded-sm transition-colors outline-none focus-visible:ring-[3px]',
          active && 'text-foreground',
        )}
      >
        {children}
        {active && (sort.desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
      </button>
    </th>
  )
}

function MembersTable({ members }: { members: ReportData['members'] }) {
  const [sort, setSort] = useState<{ key: MemberKey; desc: boolean }>({ key: 'done', desc: true })
  const rows = useMemo(() => {
    const v = (m: ReportData['members'][number]) => (sort.key === 'rate' ? (m.rate ?? -1) : m[sort.key])
    return [...members].sort((a, b) => {
      const x = v(a)
      const y = v(b)
      const c = typeof x === 'string' ? x.localeCompare(y as string, 'vi') : (x as number) - (y as number)
      return sort.desc ? -c : c
    })
  }, [members, sort])
  const onSort = (key: MemberKey) => setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }))
  const maxDone = Math.max(1, ...members.map((m) => m.done))
  const maxOpen = Math.max(1, ...members.map((m) => m.open))

  return (
    <SectionCard id="members" title="Theo thành viên" aside={<span>{members.length} người</span>} bodyClassName="px-0 pb-2">
      {members.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[14px]">
            <thead className="text-muted-foreground border-y text-left text-[12px]">
              <tr>
                <SortHeader k="name" sort={sort} onSort={onSort} className="pl-5">
                  Thành viên
                </SortHeader>
                <SortHeader k="done" sort={sort} onSort={onSort} className="w-[18%]">
                  Hoàn thành
                </SortHeader>
                <SortHeader k="rate" sort={sort} onSort={onSort}>
                  Đúng hạn
                </SortHeader>
                <SortHeader k="late" sort={sort} onSort={onSort} className="text-right">
                  Trễ
                </SortHeader>
                <SortHeader k="overdue" sort={sort} onSort={onSort} className="text-right">
                  Quá hạn
                </SortHeader>
                <SortHeader k="open" sort={sort} onSort={onSort} className="w-[16%]">
                  Đang mở
                </SortHeader>
                <SortHeader k="avgLateHours" sort={sort} onSort={onSort} className="pr-5 text-right">
                  Trễ TB
                </SortHeader>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-subtle/60 transition-colors">
                  <td className="py-2.5 pr-3 pl-5">
                    <Link to={`/members/${m.id}`} className="group flex min-w-0 items-center gap-2.5 outline-none">
                      <UserAvatar user={m} className="size-8" />
                      <span className="min-w-0">
                        <span className="group-hover:text-primary group-focus-visible:text-primary block truncate font-semibold transition-colors">
                          {m.name}
                        </span>
                        {m.title && <span className="text-muted-foreground block truncate text-[12px]">{m.title}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3">
                    <InlineBar value={m.done} max={maxDone} label={`${m.done} việc hoàn thành`} />
                  </td>
                  <td className="px-3" title={`${m.onTime} đúng hạn, ${m.late} trễ hạn`}>
                    <RatePill rate={m.rate} />
                  </td>
                  <td className={cn('num px-3 text-right', m.late ? 'text-late-foreground font-semibold' : 'text-muted-foreground')}>{m.late}</td>
                  <td className={cn('num px-3 text-right', m.overdue ? 'text-overdue-foreground font-semibold' : 'text-muted-foreground')}>
                    {m.overdue}
                  </td>
                  <td className="px-3">
                    <InlineBar value={m.open} max={maxOpen} className="bg-text-secondary/60" label={`${m.open} việc đang mở`} />
                  </td>
                  <td className="text-muted-foreground num pr-5 pl-3 text-right" title="Thời gian trễ trung bình của các việc xong trễ">
                    {m.avgLateHours ? `${m.avgLateHours.toLocaleString('vi-VN')} giờ` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-[13px]">Chưa có thành viên nào</p>
      )}
    </SectionCard>
  )
}

function ProjectsTable({ projects }: { projects: ReportData['projects'] }) {
  return (
    <SectionCard id="projects" title="Theo dự án" aside={<span>{projects.length} dự án</span>} bodyClassName="px-0 pb-2">
      {projects.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[14px]">
            <thead className="text-muted-foreground border-y text-left text-[12px]">
              <tr>
                <th scope="col" className="py-2.5 pr-3 pl-5 font-semibold">Dự án</th>
                <th scope="col" className="px-3 font-semibold">Khách hàng</th>
                <th scope="col" className="w-[26%] px-3 font-semibold">Tiến độ</th>
                <th scope="col" className="px-3 font-semibold">Đúng hạn</th>
                <th scope="col" className="px-3 text-right font-semibold">Quá hạn</th>
                <th scope="col" className="pr-5 pl-3 text-right font-semibold">Hạn dự án</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-subtle/60 transition-colors">
                  <td className="py-3 pr-3 pl-5">
                    <Link to={`/projects/${p.id}`} className="group flex min-w-0 items-center gap-2 outline-none">
                      <ProjectDot color={p.color} className="size-2.5" />
                      <span className="group-hover:text-primary group-focus-visible:text-primary truncate font-semibold transition-colors">
                        {p.name}
                      </span>
                      <span className="text-muted-foreground num shrink-0 text-[12px]">{p.key}</span>
                    </Link>
                  </td>
                  <td className="text-text-secondary max-w-48 truncate px-3">{p.clientName ?? <span className="text-muted-foreground">Nội bộ</span>}</td>
                  <td className="px-3" title={`${p.done} trên ${p.total} việc đã xong`}>
                    <div className="flex items-center gap-2">
                      <span className="bg-subtle h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color }} />
                      </span>
                      <span className="num w-10 text-right font-semibold">{p.progress}%</span>
                      <span className="text-muted-foreground num w-14 text-[12px]">
                        {p.done}/{p.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-3">
                    <RatePill rate={p.rate} />
                  </td>
                  <td className={cn('num px-3 text-right', p.overdue ? 'text-overdue-foreground font-semibold' : 'text-muted-foreground')}>
                    {p.overdue}
                  </td>
                  <td className="text-text-secondary num pr-5 pl-3 text-right">{p.dueDate ? fmtDate(p.dueDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5">
          <EmptyState icon={BarChart3} title="Chưa có dự án" description="Tạo dự án để theo dõi tiến độ tại đây." />
        </div>
      )}
    </SectionCard>
  )
}

function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card shadow-card rounded-[10px] border px-5 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-14" />
            <Skeleton className="mt-3 h-3.5 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-card shadow-card rounded-[10px] border p-5">
          <Skeleton className="h-5 w-56" />
          <div className="mt-6 flex h-52 items-end gap-2">
            {[40, 65, 30, 80, 55, 70, 45, 90, 60, 35, 75, 50].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-card shadow-card space-y-4 rounded-[10px] border p-5">
          <Skeleton className="h-5 w-28" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-72 w-full rounded-[10px]" />
    </div>
  )
}
