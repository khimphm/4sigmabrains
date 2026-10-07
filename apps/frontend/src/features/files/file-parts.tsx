import { FolderKanban, Link2, MessagesSquare, SquareCheckBig } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { fileUrl, type LibraryFile } from './api'
import { fileExt, fileKind, KIND_META } from './file-kind'

// Ô xem trước: ảnh thật cho file ảnh, ô màu theo loại cho PDF/DWG/XLSX...
export function FileThumb({ file, size = 'card', className }: {
  file: Pick<LibraryFile, 'id' | 'fileName' | 'mimeType'>
  size?: 'card' | 'row'
  className?: string
}) {
  const kind = fileKind(file.fileName, file.mimeType)
  const meta = KIND_META[kind]
  const [broken, setBroken] = useState(false)
  const Icon = meta.icon

  if (kind === 'image' && !broken)
    return (
      <div className={cn('bg-subtle relative overflow-hidden', size === 'row' ? 'size-10 rounded-md' : 'aspect-[4/3] w-full', className)}>
        <img
          src={fileUrl(file.id)}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    )

  if (size === 'row')
    return (
      <div className={cn('grid size-10 shrink-0 place-items-center rounded-md', meta.soft, className)}>
        <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
      </div>
    )

  return (
    <div className={cn('relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-gradient-to-br', meta.tile, className)}>
      {/* Lưới mờ gợi bản vẽ kỹ thuật */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
        style={{ opacity: 0.08 }}
      />
      <div className="relative flex flex-col items-center gap-2 transition-transform duration-300 group-hover:-translate-y-0.5">
        <div className="bg-card/80 grid size-12 place-items-center rounded-xl shadow-sm ring-1 ring-current/10 backdrop-blur">
          <Icon className="size-6" strokeWidth={1.6} aria-hidden />
        </div>
        <span className="text-[11px] font-bold tracking-[0.12em]">{fileExt(file.fileName)}</span>
      </div>
    </div>
  )
}

// Nguồn của file: công việc KEY-n / thảo luận / dự án
export function FileSource({ file, className }: { file: LibraryFile; className?: string }) {
  const base = 'text-text-secondary hover:text-primary inline-flex min-w-0 items-center gap-1 text-xs transition-colors'
  if (file.targetType === 'TASK' && file.target)
    return (
      <Link to={`/tasks/${file.target.id}`} className={cn(base, className)} title={file.target.title} onClick={(e) => e.stopPropagation()}>
        <SquareCheckBig className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        <span className="font-semibold">{file.target.label}</span>
        <span className="truncate">{file.target.title}</span>
      </Link>
    )
  if (file.targetType === 'DISCUSSION' && file.target)
    return (
      <Link to={`/discussions/${file.target.id}`} className={cn(base, className)} title={file.target.title} onClick={(e) => e.stopPropagation()}>
        <MessagesSquare className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        <span className="truncate">{file.target.title}</span>
      </Link>
    )
  if (file.project)
    return (
      <Link to={`/projects/${file.project.id}`} className={cn(base, className)} onClick={(e) => e.stopPropagation()}>
        <FolderKanban className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
        <span className="truncate">Tài liệu dự án</span>
      </Link>
    )
  return (
    <span className={cn('text-muted-foreground inline-flex items-center gap-1 text-xs', className)}>
      <Link2 className="size-3.5" aria-hidden />
      Không rõ nguồn
    </span>
  )
}

export function ProjectDot({ project }: { project: LibraryFile['project'] }) {
  if (!project) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} aria-hidden />
      <span className="truncate">{project.name}</span>
    </span>
  )
}
