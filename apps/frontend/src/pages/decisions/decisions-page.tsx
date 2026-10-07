import { Gavel, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { useDecisions } from '@/features/decisions/api'
import { DECISION_STATUS_META } from '@/lib/constants'
import { dueLabel, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DecisionStatus } from '@/types/api'

export function DecisionsPage() {
  const { data = [], isLoading } = useDecisions()
  const [filter, setFilter] = useState<DecisionStatus | 'ALL'>('OPEN')
  const shown = data.filter((d) => filter === 'ALL' || d.status === filter)

  return (
    <PageContainer>
      <PageHeader
        title="Phân tích & quyết định"
        description="Đặt vấn đề, so sánh phương án, cả đội bình chọn rồi chốt và lưu lại lý do"
        actions={
          <Button asChild>
            <Link to="/decisions/new">
              <Plus /> Quyết định mới
            </Link>
          </Button>
        }
      >
        <div className="flex gap-1">
          {(['OPEN', 'DECIDED', 'CANCELLED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn('rounded-full px-3 py-1 text-sm transition-colors', filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}
            >
              {f === 'ALL' ? 'Tất cả' : DECISION_STATUS_META[f].label}
              <span className="ml-1.5 opacity-60">{f === 'ALL' ? data.length : data.filter((d) => d.status === f).length}</span>
            </button>
          ))}
        </div>
      </PageHeader>
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : shown.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((d) => {
            const chosen = d.options.find((o) => o.id === d.chosenOptionId)
            return (
              <Link key={d.id} to={`/decisions/${d.id}`} className="bg-card hover:border-primary/30 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', DECISION_STATUS_META[d.status].badge)}>{DECISION_STATUS_META[d.status].label}</span>
                  {d.status === 'OPEN' && d.dueDate && <span className="text-muted-foreground text-xs">Chốt: {dueLabel(d.dueDate)}</span>}
                  {d.project && (
                    <span className="text-muted-foreground ml-auto flex items-center gap-1 text-xs">
                      <span className="size-2 rounded-[2px]" style={{ background: d.project.color }} />
                      {d.project.name}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold">{d.title}</h3>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{d.context}</p>
                {chosen && (
                  <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                    ✓ {chosen.title}
                  </div>
                )}
                <div className="text-muted-foreground mt-4 flex items-center gap-3 text-xs">
                  <UserAvatar user={d.owner} className="size-5" />
                  <span>{d.owner.name}</span>
                  <span>· {fromNow(d.createdAt)}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Users className="size-3.5" />
                    {d.voteCount ?? 0} phiếu · {d.options.length} phương án
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Gavel}
          title="Chưa có quyết định nào"
          description="Khi cần chọn giữa nhiều phương án, hãy mở một quyết định để cả đội cùng phân tích."
          action={<Button asChild><Link to="/decisions/new"><Plus /> Quyết định mới</Link></Button>}
        />
      )}
    </PageContainer>
  )
}
