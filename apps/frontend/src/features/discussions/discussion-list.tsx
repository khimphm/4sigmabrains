import { FolderKanban, MessagesSquare, Pin, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { useProjects } from '@/features/projects/api'
import { fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Discussion } from '@/types/api'
import { useDiscussions } from './api'
import { NewDiscussionDialog } from './new-discussion-dialog'

const ALL = '__all__'
const GENERAL = 'general'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

// Danh sách thảo luận nhúng được (trang Thảo luận và tab Thảo luận của dự án)
export function DiscussionList({
  projectId,
  showCreate = true,
  creating: creatingProp,
  onCreatingChange,
}: {
  projectId?: string
  showCreate?: boolean
  creating?: boolean
  onCreatingChange?: (o: boolean) => void
}) {
  const [scope, setScope] = useState(ALL)
  const [q, setQ] = useState('')
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [creatingState, setCreatingState] = useState(false)
  const creating = creatingProp ?? creatingState
  const setCreating = onCreatingChange ?? setCreatingState
  const { data: projects = [] } = useProjects()
  const effective = projectId ?? (scope === ALL ? undefined : scope)
  const { data = [], isLoading } = useDiscussions(effective)

  const shown = useMemo(() => {
    const nq = norm(q.trim())
    return data.filter((d) => (!onlyPinned || d.pinned) && (!nq || norm(`${d.title} ${d.body} ${d.author.name}`).includes(nq)))
  }, [data, q, onlyPinned])
  const pinned = shown.filter((d) => d.pinned)
  const rest = shown.filter((d) => !d.pinned)
  const pinnedCount = data.filter((d) => d.pinned).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-80">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm thảo luận…" aria-label="Tìm thảo luận" className="h-9 pl-8" />
        </div>
        {!projectId && (
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-full justify-start sm:w-56 [&>span]:flex-1 [&>span]:text-left" aria-label="Lọc theo dự án">
              <FolderKanban className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả dự án</SelectItem>
              <SelectItem value={GENERAL}>Chung toàn công ty</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <button
          type="button"
          aria-pressed={onlyPinned}
          onClick={() => setOnlyPinned((v) => !v)}
          className={cn(
            'focus-visible:ring-ring/50 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px]',
            onlyPinned ? 'border-primary/40 bg-primary-soft text-primary' : 'border-border-strong bg-card text-text-secondary hover:bg-subtle',
          )}
        >
          <Pin className="size-3.5" strokeWidth={1.8} aria-hidden />
          Đã ghim <span className="num opacity-70">{pinnedCount}</span>
        </button>
        {showCreate && (
          <Button variant={projectId ? 'outline' : 'default'} className="ml-auto" onClick={() => setCreating(true)}>
            <Plus /> Thảo luận mới
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-card divide-y rounded-[10px] border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length ? (
        <div className="space-y-4">
          {pinned.length > 0 && <Group title="Đã ghim" items={pinned} hideProject={!!projectId} />}
          {rest.length > 0 && <Group title={pinned.length ? 'Gần đây' : undefined} items={rest} hideProject={!!projectId} />}
        </div>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title={data.length ? 'Không tìm thấy thảo luận phù hợp' : 'Chưa có thảo luận'}
          description={data.length ? 'Thử từ khoá khác hoặc bỏ bộ lọc.' : 'Mở chủ đề đầu tiên để cả đội cùng trao đổi.'}
          action={
            !data.length && (
              <Button variant="outline" onClick={() => setCreating(true)}>
                <Plus /> Thảo luận mới
              </Button>
            )
          }
        />
      )}

      <NewDiscussionDialog open={creating} onOpenChange={setCreating} defaultProjectId={projectId ?? (scope !== ALL && scope !== GENERAL ? scope : null)} lockProject={!!projectId} />
    </div>
  )
}

function Group({ title, items, hideProject }: { title?: string; items: Discussion[]; hideProject: boolean }) {
  return (
    <section>
      {title && <h3 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase">{title}</h3>}
      <ul className="bg-card shadow-card divide-y overflow-hidden rounded-[10px] border">
        {items.map((d) => (
          <li key={d.id}>
            <Row d={d} hideProject={hideProject} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Row({ d, hideProject }: { d: Discussion; hideProject: boolean }) {
  return (
    <Link
      to={`/discussions/${d.id}`}
      className="group focus-visible:ring-ring/50 flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 outline-none hover:bg-subtle focus-visible:ring-[3px] focus-visible:ring-inset sm:gap-4"
    >
      <UserAvatar user={d.author} className="mt-0.5 size-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {d.pinned && <Pin className="text-primary size-3.5 shrink-0" strokeWidth={2} aria-label="Đã ghim" />}
          <span className="group-hover:text-primary truncate text-[15px] font-semibold transition-colors">{d.title}</span>
        </div>
        <p className="text-text-secondary mt-0.5 line-clamp-1 text-sm">{d.body}</p>
        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {!hideProject && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-[2px]" style={{ background: d.project?.color ?? 'var(--muted-foreground)' }} aria-hidden />
              {d.project?.name ?? 'Chung'}
            </span>
          )}
          {!hideProject && <span aria-hidden>·</span>}
          <span>{d.author.name}</span>
          <span aria-hidden>·</span>
          <time dateTime={d.lastActivityAt} title={`Hoạt động lần cuối ${fmtDateTime(d.lastActivityAt)}`}>
            {fromNow(d.lastActivityAt)}
          </time>
        </div>
      </div>
      <span
        className={cn(
          'num mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold',
          d.replyCount ? 'bg-primary-soft text-primary' : 'bg-neutral text-neutral-foreground',
        )}
        aria-label={`${d.replyCount} trả lời`}
      >
        <MessagesSquare className="size-3.5" strokeWidth={1.8} aria-hidden />
        {d.replyCount}
      </span>
    </Link>
  )
}
