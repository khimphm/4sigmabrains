import { FileStack, HardDrive, PenTool, Share2, Upload } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PageContainer, PageHeader } from '@/components/page-header'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFileLibrary } from '@/features/files/api'
import { FileLibrary } from '@/features/files/file-library'
import { fileKind } from '@/features/files/file-kind'
import { useProjects } from '@/features/projects/api'
import { fileSize } from '@/lib/format'
import { cn } from '@/lib/utils'

export function FilesPage() {
  const [params] = useSearchParams()
  const projectId = params.get('projectId') ?? undefined
  const projects = useProjects()
  const project = projects.data?.find((p) => p.id === projectId)
  const [uploadOpen, setUploadOpen] = useState(false)
  const all = useFileLibrary({ projectId })

  const stats = useMemo(() => {
    const files = all.data ?? []
    return {
      total: files.length,
      size: files.reduce((s, f) => s + f.size, 0),
      shared: files.filter((f) => f.sharedWithClient).length,
      drawings: files.filter((f) => {
        const k = fileKind(f.fileName, f.mimeType)
        return k === 'cad' || k === 'pdf'
      }).length,
      versions: files.filter((f) => f.version > 1).length,
    }
  }, [all.data])

  return (
    <PageContainer>
      <PageTopbar
        crumbs={project ? [{ label: 'Tệp và bản vẽ', to: '/files' }, { label: project.name }] : [{ label: 'Tệp và bản vẽ' }]}
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload strokeWidth={1.8} />
            <span className="hidden sm:inline">Tải lên</span>
          </Button>
        }
      />
      <PageHeader
        title="Tệp và bản vẽ"
        description={
          project
            ? `Toàn bộ bản vẽ, hồ sơ và tài liệu của dự án ${project.name}.`
            : 'Thư viện chung của mọi dự án: bản vẽ, hồ sơ, bảng tính, kèm lịch sử phiên bản.'
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={FileStack} label="Tổng số tệp" value={stats.total} hint={`${stats.versions} tệp có nhiều phiên bản`} loading={all.isLoading} />
        <Stat icon={HardDrive} label="Dung lượng" value={fileSize(stats.size)} hint="Chỉ tính bản mới nhất" loading={all.isLoading} />
        <Stat
          icon={Share2}
          label="Chia sẻ với khách hàng"
          value={stats.shared}
          hint="Hiện trong cổng khách hàng"
          tone="text-on-time-foreground bg-on-time"
          loading={all.isLoading}
        />
        <Stat
          icon={PenTool}
          label="Bản vẽ"
          value={stats.drawings}
          hint="PDF và CAD (DWG, DXF, RVT…)"
          tone="text-annotation bg-annotation/10"
          loading={all.isLoading}
        />
      </div>
      <FileLibrary showUpload={false} uploadOpen={uploadOpen} onUploadOpenChange={setUploadOpen} />
    </PageContainer>
  )
}

function Stat({ icon: Icon, label, value, hint, tone = 'bg-primary-soft text-primary', loading }: {
  icon: typeof FileStack
  label: string
  value: ReactNode
  hint?: string
  tone?: string
  loading?: boolean
}) {
  return (
    <div className="bg-card shadow-card rounded-[10px] border p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-text-secondary text-[13px] leading-tight font-semibold">{label}</span>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', tone)}>
          <Icon className="size-4" strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <div className="num mt-1.5 text-2xl font-extrabold tracking-tight sm:text-[32px] sm:leading-10">{value}</div>
      )}
      {hint && <p className="text-muted-foreground mt-0.5 truncate text-xs">{hint}</p>}
    </div>
  )
}
