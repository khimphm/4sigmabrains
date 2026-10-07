import {
  ArrowLeft,
  Ban,
  CalendarClock,
  ChevronRight,
  Ellipsis,
  FolderKanban,
  MessagesSquare,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { RichText } from '@/components/mention-textarea'
import { PageContainer, PageHeader } from '@/components/page-header'
import { DeadlineBadge, Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useDecision, useDecisionActions, useDecisions } from '@/features/decisions/api'
import { DecisionFormDialog } from '@/features/decisions/decision-form-dialog'
import { KIND_META, OpinionCard, OpinionComposer } from '@/features/decisions/opinion'
import { SealMini, SealStamp } from '@/features/decisions/seal-stamp'
import { ConfirmDialog } from '@/features/discussions/confirm-dialog'
import { useProjects } from '@/features/projects/api'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Decision, DecisionDetail, DecisionStatus, OpinionKind } from '@/types/api'

const ALL = '__all__'
const GENERAL = '__general__'

const TAB_LABEL: Record<DecisionStatus, string> = {
  OPEN: 'Đang thảo luận',
  DECIDED: 'Đã chốt',
  CANCELLED: 'Đã huỷ',
}

// Ba cột chỉ hiện đủ trên màn rộng; dưới 1024px chuyển kiểu danh sách → chi tiết
const DESKTOP = '(min-width: 1024px)'
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(DESKTOP).matches,
  )
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

export function DecisionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const { data: all = [], isLoading } = useDecisions()
  const [tab, setTab] = useState<DecisionStatus>('OPEN')
  const [q, setQ] = useState('')
  const [project, setProject] = useState(ALL)
  const [creating, setCreating] = useState(false)

  // Khi mở trực tiếp /decisions/:id, chuyển tab theo trạng thái của chủ đề
  const current = all.find((d) => d.id === id)
  useEffect(() => {
    if (current) setTab(current.status)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ đồng bộ khi đổi chủ đề
  }, [id, !!current])

  const counts = useMemo(() => {
    const c: Record<DecisionStatus, number> = { OPEN: 0, DECIDED: 0, CANCELLED: 0 }
    for (const d of all) c[d.status]++
    return c
  }, [all])

  const shown = useMemo(() => {
    const nq = norm(q.trim())
    return all
      .filter((d) => d.status === tab)
      .filter((d) => project === ALL || (project === GENERAL ? !d.projectId : d.projectId === project))
      .filter((d) => !nq || norm(`${d.title} ${d.context}`).includes(nq))
      .sort((a, b) =>
        tab === 'DECIDED'
          ? +new Date(b.decidedAt ?? b.updatedAt) - +new Date(a.decidedAt ?? a.updatedAt)
          : +new Date(b.updatedAt) - +new Date(a.updatedAt),
      )
  }, [all, tab, project, q])

  const recentDecided = useMemo(
    () =>
      all
        .filter((d) => d.status === 'DECIDED')
        .sort((a, b) => +new Date(b.decidedAt ?? 0) - +new Date(a.decidedAt ?? 0))
        .slice(0, 3),
    [all],
  )

  // Desktop: tự chọn chủ đề đầu tiên để cột giữa không trống
  useEffect(() => {
    if (isDesktop && !id && shown[0]) navigate(`/decisions/${shown[0].id}`, { replace: true })
  }, [isDesktop, id, shown, navigate])

  const showList = isDesktop || !id
  const showDetail = isDesktop || !!id

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: 'Cộng tác' }, { label: 'Phân tích và chốt', to: '/decisions' }, ...(current && !isDesktop ? [{ label: current.title }] : [])]}
        title={current?.title ?? 'Phân tích và chốt'}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> <span className="max-sm:hidden">Chủ đề mới</span>
          </Button>
        }
      />
      {showList && (
        <PageHeader
          title="Phân tích và chốt"
          description="Mỗi chủ đề gom ý kiến của cả nhóm. Bình chọn ý kiến tốt nhất, người có quyền chốt đóng dấu kết luận."
        />
      )}

      {!showList && (
        <Link
          to="/decisions"
          className="text-text-secondary hover:text-foreground mb-4 inline-flex items-center gap-1 rounded-md text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Tất cả chủ đề
        </Link>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_330px]">
        {showList && (
          <TopicList
            items={shown}
            loading={isLoading}
            tab={tab}
            setTab={setTab}
            counts={counts}
            q={q}
            setQ={setQ}
            project={project}
            setProject={setProject}
            selectedId={id}
            onCreate={() => setCreating(true)}
          />
        )}
        {showDetail &&
          (id ? (
            <DecisionView key={id} id={id} recentDecided={recentDecided} />
          ) : (
            !isLoading && (
              <div className="lg:col-span-1 xl:col-span-2">
                <EmptyState
                  icon={Scale}
                  title={all.length ? 'Không có chủ đề phù hợp' : 'Chưa có chủ đề nào'}
                  description={all.length ? 'Thử đổi bộ lọc hoặc tab khác.' : 'Mở chủ đề đầu tiên để cả nhóm góp ý và chốt kết luận.'}
                  action={
                    <Button variant="outline" onClick={() => setCreating(true)}>
                      <Plus /> Chủ đề mới
                    </Button>
                  }
                />
              </div>
            )
          ))}
      </div>

      <DecisionFormDialog open={creating} onOpenChange={setCreating} onCreated={(d) => navigate(`/decisions/${d.id}`)} />
    </PageContainer>
  )
}

/* ───────────────────────── Cột trái: danh sách chủ đề ───────────────────────── */

function TopicList(props: {
  items: Decision[]
  loading: boolean
  tab: DecisionStatus
  setTab: (t: DecisionStatus) => void
  counts: Record<DecisionStatus, number>
  q: string
  setQ: (v: string) => void
  project: string
  setProject: (v: string) => void
  selectedId?: string
  onCreate: () => void
}) {
  const { items, loading, tab, setTab, counts, q, setQ, project, setProject, selectedId } = props
  const { data: projects = [] } = useProjects()

  return (
    <aside className="bg-card shadow-card flex flex-col rounded-[10px] border lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)]">
      <div className="space-y-3 border-b p-3">
        <div className="flex items-center gap-1" role="tablist" aria-label="Trạng thái chủ đề">
          {(['OPEN', 'DECIDED'] as const).map((s) => (
            <TabButton key={s} active={tab === s} onClick={() => setTab(s)} label={TAB_LABEL[s]} count={counts[s]} />
          ))}
          {tab === 'CANCELLED' && <TabButton active onClick={() => {}} label="Đã huỷ" count={counts.CANCELLED} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="ml-auto cursor-pointer" aria-label="Thêm bộ lọc trạng thái">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(['OPEN', 'DECIDED', 'CANCELLED'] as const).map((s) => (
                <DropdownMenuItem key={s} onSelect={() => setTab(s)} className={cn(tab === s && 'font-semibold')}>
                  {s === 'CANCELLED' ? <Ban /> : s === 'DECIDED' ? <SealMini /> : <MessagesSquare />}
                  {TAB_LABEL[s]}
                  <span className="text-muted-foreground num ml-auto pl-4 text-xs">{counts[s]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chủ đề…" aria-label="Tìm chủ đề" className="h-9 pl-8" />
        </div>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="h-9 w-full" aria-label="Lọc theo dự án">
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg p-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length ? (
          <ul className="space-y-1">
            {items.map((d) => (
              <li key={d.id}>
                <TopicItem d={d} active={d.id === selectedId} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted-foreground px-4 py-10 text-center text-sm">
            {q || project !== ALL ? 'Không tìm thấy chủ đề phù hợp.' : `Chưa có chủ đề ${TAB_LABEL[tab].toLowerCase()}.`}
          </div>
        )}
      </div>
    </aside>
  )
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        active ? 'bg-foreground text-background' : 'text-text-secondary hover:bg-subtle',
      )}
    >
      {label}
      <span className={cn('num text-xs', active ? 'opacity-70' : 'text-muted-foreground')}>{count}</span>
    </button>
  )
}

function TopicItem({ d, active }: { d: Decision; active: boolean }) {
  return (
    <Link
      to={`/decisions/${d.id}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group focus-visible:ring-ring/50 block rounded-lg px-3 py-2.5 transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        active ? 'bg-primary-soft' : 'hover:bg-subtle',
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn('line-clamp-2 flex-1 text-sm leading-snug font-semibold', active && 'text-primary')}>{d.title}</span>
        {d.status === 'DECIDED' && <SealMini className="mt-0.5 shrink-0" />}
        <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0 lg:hidden" aria-hidden />
      </div>
      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ background: d.project?.color ?? 'var(--muted-foreground)' }} />
          <span className="max-w-36 truncate">{d.project?.name ?? 'Chung'}</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Số ý kiến">
          <MessagesSquare className="size-3.5" strokeWidth={1.8} aria-hidden />
          <span className="num">{d.opinionCount ?? 0}</span> ý kiến
        </span>
        <span className="inline-flex items-center gap-1" title="Số người tham gia">
          <Users className="size-3.5" strokeWidth={1.8} aria-hidden />
          <span className="num">{d.participantCount ?? 0}</span>
        </span>
      </div>
      <div className="mt-2">
        {d.status === 'OPEN' ? (
          <DeadlineBadge due={d.dueDate} className="h-5 text-[11px]" />
        ) : d.status === 'DECIDED' ? (
          <span className="text-seal text-xs font-semibold">Chốt ngày {fmtDate(d.decidedAt)}</span>
        ) : (
          <Pill className="h-5 text-[11px]" icon={Ban}>
            Đã huỷ
          </Pill>
        )}
      </div>
    </Link>
  )
}

/* ───────────────────────── Cột giữa + phải: chi tiết ───────────────────────── */

function DecisionView({ id, recentDecided }: { id: string; recentDecided: Decision[] }) {
  const { data: d, isLoading, error } = useDecision(id)

  if (isLoading) return <DetailSkeleton />
  if (error || !d) {
    return (
      <div className="xl:col-span-2">
        <EmptyState icon={Scale} title="Không tìm thấy chủ đề" description={error ? errorMessage(error) : undefined} />
      </div>
    )
  }

  return (
    <>
      <div className="min-w-0 space-y-4">
        <TopicHeader d={d} />
        <OpinionList d={d} />
      </div>
      <div className="min-w-0 space-y-4 lg:col-start-2 xl:sticky xl:top-20 xl:col-start-auto">
        <SummaryCard d={d} />
        <ConclusionCard d={d} />
        <RecentDecided items={recentDecided.filter((r) => r.id !== d.id)} />
      </div>
    </>
  )
}

function DetailSkeleton() {
  return (
    <>
      <div className="space-y-4">
        <div className="bg-card space-y-3 rounded-[10px] border p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card flex gap-3 rounded-[10px] border p-5">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4 lg:col-start-2 xl:col-start-auto">
        <Skeleton className="h-48 rounded-[10px]" />
        <Skeleton className="h-56 rounded-[10px]" />
      </div>
    </>
  )
}

// Tô màu @tên trong phần bối cảnh (backend không lưu mentionIds cho chủ đề)
function useMentionIdsIn(text: string) {
  const { data: users = [] } = useUsers()
  return useMemo(() => users.filter((u) => text.includes(`@${u.name}`)).map((u) => u.id), [users, text])
}

function TopicHeader({ d }: { d: DecisionDetail }) {
  const navigate = useNavigate()
  const { user, isManager } = useAuth()
  const { cancel, remove, reopen } = useDecisionActions(d.id)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState<null | 'cancel' | 'delete'>(null)
  const mentionIds = useMentionIdsIn(d.context)
  const isOwner = d.ownerId === user?.id
  const canEdit = isOwner || d.canDecide
  const canDelete = isOwner || isManager

  return (
    <section className="bg-card shadow-card rounded-[10px] border p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <h2 className="flex-1 text-xl leading-snug font-bold tracking-tight text-balance">{d.title}</h2>
        <div className="flex shrink-0 items-center gap-1">
          {d.status === 'OPEN' ? (
            d.dueDate ? (
              <DeadlineBadge due={d.dueDate} />
            ) : (
              <Pill tone="primary">Đang thảo luận</Pill>
            )
          ) : d.status === 'DECIDED' ? (
            <Pill tone="seal">Đã chốt</Pill>
          ) : (
            <Pill icon={Ban}>Đã huỷ</Pill>
          )}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Thao tác với chủ đề" className="cursor-pointer">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canEdit && (
                  <DropdownMenuItem onSelect={() => setEditing(true)}>
                    <Pencil /> Sửa chủ đề
                  </DropdownMenuItem>
                )}
                {canEdit && d.status === 'OPEN' && (
                  <DropdownMenuItem onSelect={() => setConfirm('cancel')}>
                    <Ban /> Huỷ chủ đề
                  </DropdownMenuItem>
                )}
                {d.status === 'CANCELLED' && d.canDecide && (
                  <DropdownMenuItem
                    onSelect={() => reopen.mutate(undefined, { onSuccess: () => toast.success('Đã mở lại chủ đề'), onError: (e) => toast.error(errorMessage(e)) })}
                  >
                    <RotateCcw /> Mở lại
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirm('delete')}>
                      <Trash2 /> Xoá chủ đề
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <dl className="text-text-secondary mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Dự án</dt>
          <span className="size-2.5 rounded-[3px]" style={{ background: d.project?.color ?? 'var(--muted-foreground)' }} aria-hidden />
          <dd>
            {d.project ? (
              <Link to={`/projects/${d.project.id}`} className="hover:text-foreground font-medium hover:underline">
                {d.project.name}
              </Link>
            ) : (
              'Chung toàn công ty'
            )}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Người mở</dt>
          <UserAvatar user={d.owner} className="size-5" />
          <dd>{d.owner.name}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Ngày mở</dt>
          <CalendarClock className="size-3.5" strokeWidth={1.8} aria-hidden />
          <dd>Mở {fmtDate(d.createdAt)}</dd>
        </div>
        {d.dueDate && (
          <div className="flex items-center gap-1.5">
            <dt>Hạn chốt</dt>
            <dd className="text-foreground font-medium">{fmtDateTime(d.dueDate)}</dd>
          </div>
        )}
      </dl>

      <div className="bg-subtle/70 mt-4 rounded-lg border-l-[3px] border-l-primary/50 px-4 py-3">
        <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">Bối cảnh</div>
        <RichText text={d.context} mentionIds={mentionIds} className="text-foreground text-[15px] leading-relaxed" />
      </div>

      <DecisionFormDialog open={editing} onOpenChange={setEditing} decision={d} />
      <ConfirmDialog
        open={confirm === 'cancel'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Huỷ chủ đề này?"
        description="Chủ đề chuyển sang mục Đã huỷ, không nhận thêm ý kiến. Có thể mở lại sau."
        confirmLabel="Huỷ chủ đề"
        pending={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(undefined, {
            onSuccess: () => (setConfirm(null), toast.success('Đã huỷ chủ đề')),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Xoá vĩnh viễn chủ đề?"
        description="Toàn bộ ý kiến và kết luận của chủ đề sẽ bị xoá. Không thể hoàn tác."
        confirmLabel="Xoá chủ đề"
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => (toast.success('Đã xoá chủ đề'), navigate('/decisions', { replace: true })),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </section>
  )
}

function OpinionList({ d }: { d: DecisionDetail }) {
  const [filter, setFilter] = useState<OpinionKind | 'ALL'>('ALL')
  const isOpen = d.status === 'OPEN'
  const count = (k: OpinionKind) => d.opinions.filter((o) => o.kind === k).length
  const shown = filter === 'ALL' ? d.opinions : d.opinions.filter((o) => o.kind === filter)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <h3 className="text-[17px] font-bold">
          Ý kiến <span className="text-muted-foreground num font-semibold">({d.opinions.length})</span>
        </h3>
        {d.opinions.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-1" role="group" aria-label="Lọc theo loại">
            {(['ALL', 'OPINION', 'QUESTION', 'PROPOSAL'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={cn(
                  'focus-visible:ring-ring/50 h-7 cursor-pointer rounded-md px-2.5 text-xs font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                  filter === k ? 'bg-card text-foreground shadow-card border' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {k === 'ALL' ? 'Tất cả' : KIND_META[k].label} <span className="num opacity-70">{k === 'ALL' ? d.opinions.length : count(k)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {shown.length ? (
        <div className="space-y-3">
          {shown.map((o) => (
            <OpinionCard key={o.id} opinion={o} decisionId={d.id} open={isOpen} />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground bg-card/50 rounded-[10px] border border-dashed px-6 py-10 text-center text-sm">
          <MessagesSquare className="mx-auto mb-2 size-6 opacity-60" strokeWidth={1.6} aria-hidden />
          {d.opinions.length ? 'Không có góp ý thuộc loại này.' : isOpen ? 'Chưa có ý kiến nào. Hãy là người góp ý đầu tiên.' : 'Chủ đề không có ý kiến nào.'}
        </div>
      )}

      {isOpen ? (
        <OpinionComposer decisionId={d.id} />
      ) : (
        <div className="text-text-secondary bg-subtle rounded-[10px] border px-4 py-3 text-sm">
          {d.status === 'DECIDED' ? 'Chủ đề đã chốt. Người có quyền chốt có thể mở lại để góp ý tiếp.' : 'Chủ đề đã huỷ, không nhận thêm ý kiến.'}
        </div>
      )}
    </>
  )
}

function SummaryCard({ d }: { d: DecisionDetail }) {
  const max = Math.max(1, ...d.summary.map((s) => s.agreeCount))
  return (
    <section className="bg-card shadow-card rounded-[10px] border p-5" aria-labelledby="summary-title">
      <div className="flex items-center gap-2">
        <Trophy className="text-primary size-[18px]" strokeWidth={1.8} aria-hidden />
        <h3 id="summary-title" className="text-[17px] font-bold">
          Tổng hợp
        </h3>
      </div>
      <p className="text-muted-foreground mt-0.5 text-[13px]">Xếp theo số người đồng ý</p>
      {d.summary.length ? (
        <ol className="mt-4 space-y-3.5">
          {d.summary.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#opinion-${s.id}`}
                className="group focus-visible:ring-ring/50 -mx-2 block rounded-md px-2 py-1 transition-colors duration-150 outline-none hover:bg-subtle focus-visible:ring-[3px]"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'num mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                      i === 0 ? 'bg-primary text-primary-foreground' : 'bg-subtle text-text-secondary border',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="line-clamp-3 flex-1 text-sm leading-snug">{s.body}</span>
                  <span className="text-primary num shrink-0 text-[13px] font-semibold whitespace-nowrap">{s.agreeCount} đồng ý</span>
                </div>
                <div className="mt-2 ml-7.5 flex items-center gap-2">
                  <div className="bg-subtle h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden>
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none', i === 0 ? 'bg-primary' : 'bg-primary/45')}
                      style={{ width: `${(s.agreeCount / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground max-w-24 truncate text-[11px]">{s.author}</span>
                </div>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground mt-4 rounded-md border border-dashed px-3 py-4 text-center text-[13px]">
          Chưa có ý kiến nào được đồng ý. Bấm “Đồng ý” ở ý kiến bạn ủng hộ.
        </p>
      )}
    </section>
  )
}

function ConclusionCard({ d }: { d: DecisionDetail }) {
  const { decide, reopen } = useDecisionActions(d.id)
  const [text, setText] = useState(d.conclusion ?? '')
  const [confirm, setConfirm] = useState<null | 'seal' | 'reopen'>(null)

  if (d.status === 'DECIDED') {
    return (
      <section className="bg-card shadow-card border-seal/25 relative overflow-hidden rounded-[10px] border p-5" aria-labelledby="conclusion-title">
        <div className="bg-seal/[0.04] pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 id="conclusion-title" className="text-seal text-[17px] font-bold">
                Kết luận
              </h3>
              <p className="text-muted-foreground mt-0.5 text-[13px]">Đã đóng dấu, có hiệu lực cho cả nhóm</p>
            </div>
            <SealStamp date={d.decidedAt} size={104} className="-mt-2 -mr-2 shrink-0 opacity-90" />
          </div>
          <p className="mt-2 text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{d.conclusion}</p>
          <div className="text-text-secondary mt-4 flex items-center gap-2 border-t pt-3 text-[13px]">
            {d.decidedBy ? <UserAvatar user={d.decidedBy} className="size-6" /> : <UserRound className="size-4" aria-hidden />}
            <span className="min-w-0">
              <span className="text-foreground font-semibold">{d.decidedBy?.name ?? 'Không rõ'}</span> chốt lúc {fmtDateTime(d.decidedAt)}
            </span>
          </div>
          {d.canDecide && (
            <Button variant="outline" size="sm" className="mt-4 w-full cursor-pointer" onClick={() => setConfirm('reopen')}>
              <RotateCcw /> Mở lại để thảo luận tiếp
            </Button>
          )}
        </div>
        <ConfirmDialog
          open={confirm === 'reopen'}
          onOpenChange={(o) => !o && setConfirm(null)}
          title="Mở lại chủ đề?"
          description="Kết luận hiện tại được giữ làm bản nháp, mọi người có thể góp ý tiếp và chốt lại sau."
          confirmLabel="Mở lại"
          tone="default"
          pending={reopen.isPending}
          onConfirm={() =>
            reopen.mutate(undefined, {
              onSuccess: () => (setConfirm(null), toast.success('Đã mở lại chủ đề')),
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        />
      </section>
    )
  }

  if (d.status === 'CANCELLED') {
    return (
      <section className="bg-card shadow-card rounded-[10px] border p-5">
        <h3 className="text-[17px] font-bold">Kết luận</h3>
        <p className="text-muted-foreground mt-2 text-sm">Chủ đề đã huỷ nên không có kết luận.</p>
      </section>
    )
  }

  const value = text
  const draft = value.trim()
  const top = d.summary[0]

  return (
    <section className="bg-card shadow-card rounded-[10px] border p-5" aria-labelledby="conclusion-title">
      <h3 id="conclusion-title" className="text-[17px] font-bold">
        Kết luận
      </h3>
      <Label htmlFor="conclusion" className="sr-only">
        Nội dung kết luận
      </Label>
      <Textarea
        id="conclusion"
        rows={4}
        value={value}
        onChange={(e) => setText(e.target.value)}
        disabled={!d.canDecide}
        placeholder={d.canDecide ? 'Ghi kết luận cuối cùng của nhóm…' : 'Người có quyền chốt sẽ ghi kết luận tại đây'}
        className="mt-3 resize-none text-[15px]"
      />
      {d.canDecide && top && !draft && (
        <button
          type="button"
          onClick={() => setText(top.body)}
          className="text-primary mt-2 cursor-pointer text-left text-xs font-semibold hover:underline"
        >
          Dùng ý kiến dẫn đầu ({top.agreeCount} đồng ý) làm bản nháp
        </button>
      )}
      <Button
        type="button"
        size="lg"
        disabled={!d.canDecide || !draft}
        onClick={() => setConfirm('seal')}
        className="bg-seal hover:bg-seal/90 mt-3 w-full cursor-pointer font-bold text-white"
      >
        Đóng dấu chốt
      </Button>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        {d.canDecide ? 'Sau khi chốt, mọi người tham gia nhận thông báo. Có thể mở lại khi cần.' : 'Chỉ quản lý dự án và quản trị viên được chốt.'}
      </p>

      <ConfirmDialog
        open={confirm === 'seal'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Đóng dấu chốt chủ đề?"
        description="Kết luận sau sẽ được ghi nhận và gửi tới mọi người đã tham gia."
        confirmLabel="Đóng dấu chốt"
        tone="seal"
        pending={decide.isPending}
        onConfirm={() =>
          decide.mutate(draft, {
            onSuccess: () => {
              setConfirm(null)
              setText('')
              toast.success('Đã đóng dấu chốt')
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      >
        <blockquote className="border-seal/60 bg-subtle max-h-48 overflow-y-auto rounded-md border-l-[3px] px-3 py-2 text-sm whitespace-pre-wrap">{draft}</blockquote>
      </ConfirmDialog>
    </section>
  )
}

function RecentDecided({ items }: { items: Decision[] }) {
  if (!items.length) return null
  return (
    <section className="border-seal/30 bg-seal/[0.05] relative overflow-hidden rounded-[10px] border p-5" aria-labelledby="recent-decided">
      <SealStamp size={92} className="pointer-events-none absolute -top-3 -right-4 opacity-25" />
      <h3 id="recent-decided" className="text-seal relative text-sm font-bold">
        Đã chốt gần nhất
      </h3>
      <ul className="relative mt-3 space-y-3">
        {items.slice(0, 3).map((d) => (
          <li key={d.id}>
            <Link
              to={`/decisions/${d.id}`}
              className="focus-visible:ring-ring/50 -mx-2 block rounded-md px-2 py-1.5 transition-colors duration-150 outline-none hover:bg-card/70 focus-visible:ring-[3px]"
            >
              <div className="line-clamp-2 text-sm font-semibold">{d.title}</div>
              {d.conclusion && <p className="text-text-secondary mt-0.5 line-clamp-2 text-[13px]">{d.conclusion}</p>}
              <div className="text-muted-foreground mt-1 text-xs">
                {d.decidedBy?.name ?? '—'} chốt, {fmtDate(d.decidedAt, 'dd/MM')}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
