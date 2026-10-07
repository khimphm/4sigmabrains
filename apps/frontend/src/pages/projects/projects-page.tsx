import { CalendarDays, FolderKanban, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarStack } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useProjects } from '@/features/projects/api'
import { ProjectFormDialog } from '@/features/projects/project-form-dialog'
import { PROJECT_STATUS_META } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/api'

const FILTERS: { value: ProjectStatus | 'ALL'; label: string }[] = [
  { value: 'ACTIVE', label: 'Đang chạy' },
  { value: 'ON_HOLD', label: 'Tạm dừng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
  { value: 'ALL', label: 'Tất cả' },
]

export function ProjectsPage() {
  const { isManager } = useAuth()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<ProjectStatus | 'ALL'>('ACTIVE')
  const { data: projects = [], isLoading } = useProjects()
  const shown = projects.filter((p) => filter === 'ALL' || p.status === filter)
  const creating = params.get('new') === '1'
  const setCreating = (o: boolean) => setParams((p) => (o ? p.set('new', '1') : p.delete('new'), p))

  return (
    <PageContainer wide>
      <PageHeader
        title="Dự án"
        description={`${projects.length} dự án`}
        actions={
          isManager && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Dự án mới
            </Button>
          )
        }
      >
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition-colors',
                filter === f.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{f.value === 'ALL' ? projects.length : projects.filter((p) => p.status === f.value).length}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const pct = p.stats.total ? Math.round((p.stats.done / p.stats.total) * 100) : 0
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="bg-card group hover:border-primary/30 relative overflow-hidden rounded-xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: p.color }}>
                    {p.key.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{p.name}</h3>
                    <span className="text-muted-foreground font-mono text-xs">{p.key}</span>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PROJECT_STATUS_META[p.status].badge)}>
                    {PROJECT_STATUS_META[p.status].label}
                  </span>
                </div>
                <p className="text-muted-foreground mt-3 line-clamp-2 min-h-10 text-sm">{p.description || 'Chưa có mô tả'}</p>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={pct} className="h-1.5" />
                  <span className="text-xs font-medium tabular-nums">{pct}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <AvatarStack users={p.members.map((m) => m.user)} />
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    {p.stats.overdue > 0 && <span className="font-medium text-red-600">{p.stats.overdue} trễ hạn</span>}
                    <span>{p.stats.done}/{p.stats.total} việc</span>
                    {p.dueDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {fmtDate(p.dueDate, 'dd/MM')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Chưa có dự án nào"
          description={isManager ? 'Tạo dự án đầu tiên để bắt đầu giao việc.' : 'Quản lý sẽ thêm bạn vào dự án.'}
          action={isManager && <Button onClick={() => setCreating(true)}><Plus /> Dự án mới</Button>}
        />
      )}
      <ProjectFormDialog open={creating} onOpenChange={setCreating} />
    </PageContainer>
  )
}
