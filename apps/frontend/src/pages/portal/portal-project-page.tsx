import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Flag,
  FolderOpen,
  Mail,
  SearchX,
  UserRound,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { DeadlineBadge } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { portalFileUrl, progressOf, usePortalProject, type PortalFile, type PortalTask } from '@/features/portal/api'
import { STATUS_META } from '@/lib/constants'
import { fileSize, fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/api'
import { ProgressRing, ProjectStatusPill } from './parts'

// Thứ tự hiển thị cho khách: việc đang làm lên trước
const GROUPS: { status: TaskStatus; label: string }[] = [
  { status: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { status: 'REVIEW', label: 'Đang kiểm tra' },
  { status: 'TODO', label: 'Sắp thực hiện' },
  { status: 'DONE', label: 'Đã hoàn thành' },
]

export function PortalProjectPage() {
  const { id } = useParams()
  const { data, isLoading, error } = usePortalProject(id)

  useEffect(() => {
    document.title = `${data?.project.name ?? 'Dự án'} · 4SigmaBrains`
  }, [data?.project.name])

  if (isLoading) return <LoadingView />
  if (error || !data)
    return (
      <Shell>
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy dự án"
          description="Dự án không tồn tại hoặc chưa được chia sẻ với đơn vị của bạn."
          action={
            <Button variant="outline" asChild>
              <Link to="/portal">Về danh sách dự án</Link>
            </Button>
          }
          className="bg-card"
        />
      </Shell>
    )

  const { project, tasks, files, milestones } = data
  const done = tasks.filter((t) => t.status === 'DONE').length
  const pct = progressOf(done, tasks.length)
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'REVIEW').length

  return (
    <Shell>
      {/* Hero */}
      <section className="bg-card shadow-card relative overflow-hidden rounded-[14px] border">
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: project.color }} aria-hidden />
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center md:p-8">
          <ProgressRing value={pct} size={136} stroke={12} color={project.color} label="hoàn thành" className="self-center md:self-auto" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide">{project.key}</span>
              <ProjectStatusPill status={project.status} />
            </div>
            <h1 className="mt-1 text-[26px] leading-tight font-extrabold tracking-tight md:text-[30px]">{project.name}</h1>
            {project.description && <p className="text-text-secondary mt-2 max-w-3xl text-[15px] whitespace-pre-line">{project.description}</p>}
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact label="Khởi công" value={project.startDate ? fmtDate(project.startDate) : '—'} />
              <Fact label="Dự kiến bàn giao" value={project.dueDate ? fmtDate(project.dueDate) : '—'} />
              <Fact label="Hạng mục" value={`${done}/${tasks.length}`} />
              <Fact label="Đang thực hiện" value={inProgress} />
            </dl>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card title="Tiến độ hạng mục" description="Danh sách công việc của dự án theo trạng thái.">
            {tasks.length === 0 ? (
              <EmptyState icon={Flag} title="Chưa có hạng mục" description="Đội ngũ đang lập kế hoạch cho dự án." className="py-10" />
            ) : (
              <>
                <StatusBar tasks={tasks} />
                <div className="mt-5 space-y-3">
                  {GROUPS.map((g) => (
                    <TaskGroup key={g.status} label={g.label} status={g.status} tasks={tasks.filter((t) => t.status === g.status)} />
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card title="Tài liệu được chia sẻ" description="Bản vẽ, báo cáo và hồ sơ đội ngũ đã chia sẻ với bạn (bản mới nhất).">
            {files.length === 0 ? (
              <EmptyState icon={FolderOpen} title="Chưa có tài liệu" description="Tài liệu sẽ xuất hiện khi đội ngũ chia sẻ." className="py-10" />
            ) : (
              <ul className="divide-border -my-2 divide-y">
                {files.map((f) => (
                  <FileRow key={f.id} f={f} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card title="Liên hệ dự án">
            <div className="flex items-center gap-3">
              <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-full">
                <UserRound className="size-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{project.leadName}</div>
                <div className="text-text-secondary text-[13px]">Trưởng dự án</div>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <a href={`mailto:${project.leadEmail}?subject=${encodeURIComponent(`[${project.key}] ${project.name}`)}`}>
                <Mail strokeWidth={1.8} />
                {project.leadEmail}
              </a>
            </Button>
          </Card>

          <Card title="Mốc đã hoàn thành" description="Các hạng mục hoàn thành gần nhất.">
            {milestones.length === 0 ? (
              <p className="text-text-secondary text-sm">Chưa có hạng mục nào hoàn thành.</p>
            ) : (
              <ol className="relative">
                {milestones.map((m, i) => (
                  <li key={m.number} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < milestones.length - 1 && <span className="bg-border absolute top-6 bottom-0 left-[11px] w-px" aria-hidden />}
                    <span className="bg-on-time text-on-time-foreground relative z-10 grid size-6 shrink-0 place-items-center rounded-full">
                      <CheckCircle2 className="size-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="text-sm leading-snug font-semibold">{m.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="text-text-secondary">{m.completedAt ? fmtDate(m.completedAt) : '—'}</span>
                        {m.dueDate && <DeadlineBadge due={m.dueDate} done completedAt={m.completedAt} />}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      <Link
        to="/portal"
        className="text-text-secondary hover:text-foreground mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} />
        Dự án của tôi
      </Link>
      {children}
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-card shadow-card rounded-[12px] border">
      <header className="px-5 pt-5 md:px-6">
        <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
        {description && <p className="text-text-secondary mt-0.5 text-[13px]">{description}</p>}
      </header>
      <div className="px-5 pt-4 pb-5 md:px-6">{children}</div>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-subtle rounded-lg border px-3 py-2.5">
      <dt className="text-text-secondary text-[12px] font-semibold">{label}</dt>
      <dd className="num mt-0.5 text-[15px] font-bold">{value}</dd>
    </div>
  )
}

function StatusBar({ tasks }: { tasks: PortalTask[] }) {
  const counts = GROUPS.map((g) => ({ ...g, n: tasks.filter((t) => t.status === g.status).length }))
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full border" aria-hidden>
        {counts
          .filter((c) => c.n)
          .map((c) => (
            <span key={c.status} className={STATUS_META[c.status].dot} style={{ width: `${(c.n / tasks.length) * 100}%` }} />
          ))}
      </div>
      <ul className="text-text-secondary mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {counts.map((c) => (
          <li key={c.status} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-full', STATUS_META[c.status].dot)} />
            {c.label}
            <span className="num text-foreground font-semibold">{c.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TaskGroup({ label, status, tasks }: { label: string; status: TaskStatus; tasks: PortalTask[] }) {
  const [open, setOpen] = useState(status !== 'DONE' || tasks.length <= 5)
  if (!tasks.length) return null
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="hover:bg-subtle flex w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors"
      >
        <span className={cn('size-2.5 rounded-full', STATUS_META[status].dot)} />
        <span className="text-[15px] font-semibold">{label}</span>
        <span className="bg-subtle num text-text-secondary rounded-md border px-1.5 text-xs font-semibold">{tasks.length}</span>
        <ChevronDown className={cn('text-muted-foreground ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="divide-border divide-y border-t">
          {tasks.map((t) => {
            const isDone = t.status === 'DONE'
            return (
              <li key={t.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className={cn('text-sm font-semibold', isDone && 'text-text-secondary')}>{t.title}</div>
                  <div className="text-muted-foreground mt-0.5 text-[13px]">
                    #{t.number}
                    {t.assigneeName && ` · Phụ trách: ${t.assigneeName}`}
                    {isDone && t.completedAt && ` · Xong ${fmtDate(t.completedAt)}`}
                  </div>
                </div>
                <DeadlineBadge due={t.dueDate} done={isDone} completedAt={t.completedAt} hideNone />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FileTypeIcon({ mime }: { mime: string }) {
  const cls = 'size-[18px]'
  if (mime.startsWith('image/')) return <FileImage className={cls} strokeWidth={1.8} />
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return <FileSpreadsheet className={cls} strokeWidth={1.8} />
  if (mime.includes('pdf') || mime.includes('word') || mime.startsWith('text/')) return <FileText className={cls} strokeWidth={1.8} />
  return <File className={cls} strokeWidth={1.8} />
}

function FileRow({ f }: { f: PortalFile }) {
  const url = portalFileUrl(f.id)
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="bg-subtle text-text-secondary grid size-10 shrink-0 place-items-center rounded-lg border">
        <FileTypeIcon mime={f.mimeType} />
      </span>
      <div className="min-w-0 flex-1">
        <a href={url} target="_blank" rel="noreferrer" className="hover:text-primary block truncate text-sm font-semibold transition-colors">
          {f.fileName}
        </a>
        <div className="text-muted-foreground truncate text-[13px]">
          {fileSize(f.size)}
          {f.version > 1 && ` · Phiên bản ${f.version}`} · {fmtDate(f.createdAt)} · {f.uploaderName}
        </div>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={url} download={f.fileName} aria-label={`Tải xuống ${f.fileName}`}>
          <Download strokeWidth={1.8} />
          <span className="hidden sm:inline">Tải xuống</span>
        </a>
      </Button>
    </li>
  )
}

function LoadingView() {
  return (
    <Shell>
      <Skeleton className="h-[200px] rounded-[14px]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[420px] rounded-[12px]" />
        <div className="space-y-6">
          <Skeleton className="h-[160px] rounded-[12px]" />
          <Skeleton className="h-[260px] rounded-[12px]" />
        </div>
      </div>
    </Shell>
  )
}
