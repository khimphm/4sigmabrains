import { ArrowRight, BadgeCheck, ChevronDown, Download, FileJson, GitPullRequestArrow, ScanSearch, SquareDashedMousePointer, Upload } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PageContainer, PageHeader } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/use-auth'
import { DRAWING_STATUS, DRAWING_STATUSES, exportUrl, useBatches, useDatasetStats, type DatasetStats } from '@/features/dataset/api'
import { BatchDrawings } from '@/features/dataset/batch-drawings'
import { BatchList } from '@/features/dataset/batch-list'
import { LabelsPanel } from '@/features/dataset/labels-panel'
import { UploadDrawingsDialog } from '@/features/dataset/upload-drawings-dialog'
import { cn } from '@/lib/utils'

const STATUS_KEY: Record<string, keyof DatasetStats> = {
  UNLABELED: 'unlabeled',
  LABELING: 'labeling',
  IN_REVIEW: 'inReview',
  CHANGES_REQUESTED: 'changesRequested',
  APPROVED: 'approved',
}

export function DatasetPage() {
  const { isManager } = useAuth()
  const [params, setParams] = useSearchParams()
  const batches = useBatches()
  const stats = useDatasetStats()
  const [uploadOpen, setUploadOpen] = useState(false)

  const batchId = params.get('batch') ?? batches.data?.[0]?.id
  const batch = batches.data?.find((b) => b.id === batchId)
  const selectBatch = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('batch', id)
    setParams(next, { replace: true })
  }

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={batch ? [{ label: 'Dataset bản vẽ', to: '/dataset' }, { label: batch.name }] : [{ label: 'Dataset bản vẽ' }]}
        title="Dataset bản vẽ"
        actions={
          <>
            <ExportMenu batchId={batch?.id} batchName={batch?.name} />
            <Button onClick={() => setUploadOpen(true)} disabled={!batches.data?.length}>
              <Upload strokeWidth={1.8} />
              <span className="hidden sm:inline">Tải bản vẽ lên</span>
            </Button>
          </>
        }
      />
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Dataset bản vẽ
            <Pill tone="due-soon" className="align-middle">
              Giai đoạn 2
            </Pill>
          </span>
        }
        description="Gán nhãn lỗi trực tiếp trên bản vẽ, duyệt chéo, rồi xuất dữ liệu cho fine-tuning và RL."
        actions={<HeaderStats stats={stats.data} loading={stats.isLoading} />}
      />

      <StatusBar stats={stats.data} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <BatchList batches={batches.data ?? []} loading={batches.isLoading} selectedId={batch?.id} onSelect={selectBatch} canManage={isManager} />
        <BatchDrawings batch={batch} canManage={isManager} onUpload={() => setUploadOpen(true)} />
        <div className="space-y-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0 2xl:col-span-1 2xl:block 2xl:space-y-5">
          <LabelsPanel stats={stats.data} canManage={isManager} />
          <WorkflowCard />
        </div>
      </div>

      <UploadDrawingsDialog
        key={batch?.id ?? 'none'}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultBatchId={batch?.id}
        onUploaded={selectBatch}
      />
    </PageContainer>
  )
}

function HeaderStats({ stats, loading }: { stats?: DatasetStats; loading: boolean }) {
  const annotations = stats?.byLabel.reduce((s, b) => s + b.count, 0) ?? 0
  const items = [
    { label: 'Tổng bản vẽ', value: stats?.total },
    { label: 'Đã duyệt', value: stats?.approved },
    { label: 'Chờ duyệt', value: stats?.inReview },
    { label: 'Vùng lỗi', value: annotations },
  ]
  return (
    <dl className="grid w-full grid-cols-4 gap-2 sm:w-auto">
      {items.map((it) => (
        <div key={it.label} className="bg-card shadow-card min-w-0 rounded-[10px] border px-3 py-2 sm:min-w-[96px]">
          {loading ? <Skeleton className="h-7 w-10" /> : <dd className="num text-xl leading-7 font-extrabold sm:text-[22px]">{it.value ?? 0}</dd>}
          <dt className="text-muted-foreground text-[11px] leading-tight sm:truncate sm:text-xs">{it.label}</dt>
        </div>
      ))}
    </dl>
  )
}

// Thanh phân bố trạng thái toàn bộ dataset
function StatusBar({ stats }: { stats?: DatasetStats }) {
  if (!stats || stats.total === 0) return null
  const pct = Math.round((stats.approved / stats.total) * 100)
  return (
    <div className="bg-card shadow-card rounded-[10px] border p-4">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">
          Tiến độ dataset <span className="num text-on-time-foreground ml-1">{pct}% đã duyệt</span>
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {DRAWING_STATUSES.map((s) => (
            <li key={s} className="text-text-secondary inline-flex items-center gap-1.5 text-xs">
              <span className={cn('size-2 rounded-full', DRAWING_STATUS[s].bar)} aria-hidden />
              {DRAWING_STATUS[s].label}
              <span className="num text-foreground font-semibold">{stats[STATUS_KEY[s]] as number}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-subtle flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {[...DRAWING_STATUSES].reverse().map((s) => {
          const n = stats[STATUS_KEY[s]] as number
          return n ? <div key={s} className={cn('h-full transition-[width] duration-700', DRAWING_STATUS[s].bar)} style={{ width: `${(n / stats.total) * 100}%` }} /> : null
        })}
      </div>
    </div>
  )
}

function ExportMenu({ batchId, batchName }: { batchId?: string; batchName?: string }) {
  const [onlyBatch, setOnlyBatch] = useState(false)
  const go = (format: 'jsonl' | 'coco', all: boolean) => {
    window.location.href = exportUrl({ format, all, batchId: onlyBatch ? batchId : undefined })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download strokeWidth={1.8} />
          <span className="hidden md:inline">Xuất dữ liệu training</span>
          <ChevronDown className="text-muted-foreground size-3.5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Chỉ bản vẽ đã duyệt (khuyên dùng)</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => go('jsonl', false)}>
          <FileJson strokeWidth={1.8} />
          <span className="flex-1">JSONL</span>
          <span className="text-muted-foreground text-xs">fine-tuning</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => go('coco', false)}>
          <FileJson strokeWidth={1.8} />
          <span className="flex-1">COCO</span>
          <span className="text-muted-foreground text-xs">phát hiện vùng</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs">Tất cả bản vẽ (kể cả chưa duyệt)</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => go('jsonl', true)}>
          <FileJson strokeWidth={1.8} />
          JSONL, tất cả
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => go('coco', true)}>
          <FileJson strokeWidth={1.8} />
          COCO, tất cả
        </DropdownMenuItem>
        {batchId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={onlyBatch} onCheckedChange={(v) => setOnlyBatch(v === true)} onSelect={(e) => e.preventDefault()}>
              <span className="truncate">Chỉ đợt “{batchName}”</span>
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const STEPS = [
  { icon: SquareDashedMousePointer, title: 'Gán nhãn', text: 'Khoanh vùng lỗi trên bản vẽ, chọn loại lỗi trong bộ nhãn.' },
  { icon: GitPullRequestArrow, title: 'Gửi duyệt', text: 'Người gán nhãn gửi bản vẽ cho người duyệt.' },
  { icon: ScanSearch, title: 'Duyệt chéo', text: 'Người thứ hai chấp nhận hoặc trả về từng vùng lỗi.' },
  { icon: BadgeCheck, title: 'Xuất training', text: 'Bản vẽ đã duyệt được xuất JSONL / COCO.' },
]

function WorkflowCard() {
  return (
    <section className="bg-card shadow-card rounded-[10px] border p-4" aria-labelledby="workflow-title">
      <h2 id="workflow-title" className="mb-3 text-[17px] font-bold">
        Quy trình
      </h2>
      <ol className="space-y-0">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative flex gap-3 pb-4 last:pb-0">
            {i < STEPS.length - 1 && <span aria-hidden className="bg-border absolute top-9 bottom-1 left-[15px] w-px" />}
            <span className="bg-primary-soft text-primary relative grid size-8 shrink-0 place-items-center rounded-lg">
              <Icon className="size-4" strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-muted-foreground num text-xs">{i + 1}</span>
                {title}
                {i < STEPS.length - 1 && <ArrowRight className="text-muted-foreground size-3" aria-hidden />}
              </p>
              <p className="text-text-secondary mt-0.5 text-xs leading-relaxed">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
