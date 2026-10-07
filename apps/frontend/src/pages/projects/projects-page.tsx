import { AlertTriangle, Building2, FolderKanban, LayoutGrid, List, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack, UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useClientOptions, useProjects } from '@/features/projects/api'
import { ProjectFormDialog } from '@/features/projects/project-form-dialog'
import {
  ProjectDue,
  ProjectMark,
  ProjectProgress,
  ProjectStatusPill,
} from '@/features/projects/project-parts'
import { projectLead } from '@/features/projects/project-utils'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/api'

type StatusFilter = ProjectStatus | 'ALL'
type Layout = 'grid' | 'list'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang chạy' },
  { value: 'ON_HOLD', label: 'Tạm dừng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
  { value: 'ALL', label: 'Tất cả' },
]
const ALL_CLIENTS = '__all__'
const NO_CLIENT = '__none__'
const LAYOUT_KEY = 'projects.layout'

const readLayout = (): Layout => {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function ProjectsPage() {
  const { isManager } = useAuth()
  const [params, setParams] = useSearchParams()
  const { data: projects = [], isLoading } = useProjects()
  const { data: clients = [] } = useClientOptions()
  const [layout, setLayout] = useState<Layout>(readLayout)
  const status = (params.get('status') as StatusFilter) || 'ACTIVE'
  const client = params.get('client') ?? ALL_CLIENTS
  const [q, setQ] = useState('')
  const creating = params.get('new') === '1' && isManager

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, layout)
    } catch {
      /* bỏ qua */
    }
  }, [layout])

  const setParam = (k: string, v: string | null) =>
    setParams(
      (p) => {
        if (v === null) p.delete(k)
        else p.set(k, v)
        return p
      },
      { replace: true },
    )
  const setCreating = (o: boolean) => setParam('new', o ? '1' : null)

  const base = useMemo(
    () =>
      projects.filter((p) => {
        if (client === NO_CLIENT ? p.clientId : client !== ALL_CLIENTS && p.clientId !== client) return false
        if (!q) return true
        const s = q.toLowerCase()
        return `${p.name} ${p.key} ${p.client?.name ?? ''}`.toLowerCase().includes(s)
      }),
    [projects, client, q],
  )
  const shown = base.filter((p) => status === 'ALL' || p.status === status)
  const count = (s: StatusFilter) => (s === 'ALL' ? base.length : base.filter((p) => p.status === s).length)
  const active = projects.filter((p) => p.status === 'ACTIVE')
  const overdueTotal = active.reduce((s, p) => s + p.stats.overdue, 0)
  const filtered = !!q || client !== ALL_CLIENTS

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: 'Dự án' }]}
        actions={
          isManager && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Tạo dự án
            </Button>
          )
        }
      />
      <PageHeader
        title="Dự án"
        description={
          isLoading ? (
            'Đang tải…'
          ) : (
            <>
              {active.length} dự án đang chạy
              {overdueTotal > 0 && (
                <span className="text-overdue-foreground font-semibold"> · {overdueTotal} việc quá hạn cần xử lý</span>
              )}
            </>
          )
        }
      />

      {/* Thanh lọc */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="tablist"
          aria-label="Lọc theo trạng thái"
          className="bg-subtle -mx-4 flex gap-0.5 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:w-fit sm:rounded-md sm:border sm:p-0.5"
        >
          {FILTERS.map((f) => {
            const on = status === f.value
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setParam('status', f.value === 'ACTIVE' ? null : f.value)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  on ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
                <span className={cn('num text-xs', on ? 'text-primary font-semibold' : 'opacity-70')}>{count(f.value)}</span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <div className="relative min-w-0 flex-1 sm:max-w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, mã, khách hàng"
              aria-label="Tìm dự án"
              className="bg-card h-9 pr-8 pl-8"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                aria-label="Xoá tìm kiếm"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={client} onValueChange={(v) => setParam('client', v === ALL_CLIENTS ? null : v)}>
            <SelectTrigger className="bg-card h-9 w-full sm:w-52" aria-label="Lọc theo khách hàng">
              <Building2 className="text-muted-foreground size-4" strokeWidth={1.8} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLIENTS}>Mọi khách hàng</SelectItem>
              <SelectItem value={NO_CLIENT}>Dự án nội bộ</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div role="radiogroup" aria-label="Kiểu hiển thị" className="bg-subtle hidden rounded-md border p-0.5 sm:flex">
            {(
              [
                ['grid', LayoutGrid, 'Dạng lưới'],
                ['list', List, 'Dạng danh sách'],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={layout === v}
                aria-label={label}
                title={label}
                onClick={() => setLayout(v)}
                className={cn(
                  'grid size-8 cursor-pointer place-items-center rounded-[5px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  layout === v ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-[10px] border p-5">
              <div className="flex gap-3">
                <Skeleton className="size-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="mt-6 h-1.5 w-full" />
              <div className="mt-5 flex justify-between">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length ? (
        layout === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <ProjectRows projects={shown} />
        )
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={filtered ? 'Không có dự án phù hợp' : projects.length ? 'Không có dự án ở trạng thái này' : 'Chưa có dự án nào'}
          description={
            filtered
              ? 'Thử đổi từ khoá hoặc bộ lọc khách hàng.'
              : isManager
                ? 'Tạo dự án để bắt đầu giao việc và theo dõi tiến độ.'
                : 'Quản lý sẽ thêm bạn vào dự án.'
          }
          action={
            filtered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQ('')
                  setParam('client', null)
                }}
              >
                Xoá bộ lọc
              </Button>
            ) : (
              isManager &&
              !projects.length && (
                <Button variant="outline" onClick={() => setCreating(true)}>
                  <Plus /> Tạo dự án
                </Button>
              )
            )
          }
        />
      )}
      <ProjectFormDialog open={creating} onOpenChange={setCreating} />
    </PageContainer>
  )
}

function ProjectCard({ project: p }: { project: Project }) {
  const lead = projectLead(p)
  return (
    <Link
      to={`/projects/${p.id}`}
      className="group bg-card shadow-card hover:border-border-strong hover:shadow-pop focus-visible:ring-ring/50 relative flex flex-col overflow-hidden rounded-[10px] border p-5 transition-all duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-[3px] motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start gap-3">
        <ProjectMark project={p} />
        <div className="min-w-0 flex-1">
          <h3 className="group-hover:text-primary line-clamp-2 text-[17px] leading-tight font-bold transition-colors">{p.name}</h3>
          <div className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1.5 text-[13px]">
            <span className="num font-semibold">{p.key}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{p.client?.name ?? 'Nội bộ'}</span>
          </div>
        </div>
        <ProjectStatusPill status={p.status} />
      </div>

      <p className="text-text-secondary mt-3 line-clamp-2 min-h-10 text-sm">{p.description || 'Chưa có mô tả.'}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[13px]">
          <span className="text-text-secondary">
            <span className="num text-foreground font-semibold">{p.stats.done}</span>/{p.stats.total} việc hoàn thành
          </span>
          {p.stats.overdue > 0 ? (
            <span className="text-overdue-foreground inline-flex items-center gap-1 font-semibold">
              <AlertTriangle className="size-3.5" strokeWidth={2} aria-hidden />
              {p.stats.overdue} quá hạn
            </span>
          ) : (
            p.stats.total > 0 && <span className="text-on-time-foreground font-medium">Không có việc quá hạn</span>
          )}
        </div>
        <ProjectProgress project={p} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <AvatarStack users={p.members.map((m) => m.user)} max={4} />
          {lead && <span className="text-muted-foreground hidden truncate text-xs 2xl:inline">Trưởng: {lead.name}</span>}
        </div>
        <ProjectDue project={p} className="shrink-0" />
      </div>
    </Link>
  )
}

function ProjectRows({ projects }: { projects: Project[] }) {
  const cols = 'md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_minmax(150px,1fr)_110px_minmax(0,1fr)]'
  return (
    <div className="bg-card shadow-card overflow-hidden rounded-[10px] border">
      <div className={cn('bg-subtle text-muted-foreground hidden gap-4 border-b px-4 py-2.5 text-[13px] font-semibold md:grid', cols)}>
        <span>Dự án</span>
        <span>Khách hàng</span>
        <span>Trạng thái</span>
        <span>Tiến độ</span>
        <span>Quá hạn</span>
        <span>Hạn · Thành viên</span>
      </div>
      <ul>
        {projects.map((p) => {
          const lead = projectLead(p)
          return (
            <li key={p.id} className="border-b last:border-0">
              <Link
                to={`/projects/${p.id}`}
                className={cn(
                  'hover:bg-subtle focus-visible:bg-subtle grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors outline-none',
                  cols,
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ProjectMark project={p} className="size-8 text-[11px]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-muted-foreground num block truncate text-xs">
                      {p.key}
                      {lead && ` · Trưởng: ${lead.name}`}
                    </span>
                  </span>
                </span>
                <span className="text-text-secondary hidden truncate text-sm md:block">{p.client?.name ?? 'Nội bộ'}</span>
                <span>
                  <ProjectStatusPill status={p.status} />
                </span>
                <span className="col-span-2 md:col-span-1">
                  <ProjectProgress project={p} />
                </span>
                <span className="hidden text-sm md:block">
                  {p.stats.overdue > 0 ? (
                    <span className="text-overdue-foreground font-semibold">{p.stats.overdue} việc</span>
                  ) : (
                    <span className="text-muted-foreground">Không</span>
                  )}
                </span>
                <span className="col-span-2 flex items-center justify-between gap-2 md:col-span-1">
                  <ProjectDue project={p} />
                  <span className="flex -space-x-1.5">
                    {p.members.slice(0, 3).map((m) => (
                      <UserAvatar key={m.userId} user={m.user} className="ring-card size-6 ring-2" />
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
