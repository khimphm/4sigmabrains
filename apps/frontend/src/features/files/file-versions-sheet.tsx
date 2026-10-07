import { Download, History, Upload } from 'lucide-react'

import { UserAvatar } from '@/components/user-avatar'
import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { fileSize, fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'

import { fileUrl, useFileVersions, type LibraryFile } from './api'

export function FileVersionsSheet({ file, onOpenChange, onUploadVersion }: {
  file: LibraryFile | null
  onOpenChange: (open: boolean) => void
  onUploadVersion?: (file: LibraryFile) => void
}) {
  const versions = useFileVersions(file?.id ?? null)
  return (
    <Sheet open={!!file} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-[18px]" strokeWidth={1.8} aria-hidden />
            Lịch sử phiên bản
          </SheetTitle>
          <SheetDescription className="truncate">{file?.fileName}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {versions.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[72px] w-full rounded-[10px]" />
              ))}
            </div>
          ) : (
            <ol className="relative space-y-3">
              {versions.data?.map((v, i) => (
                <li key={v.id} className="relative pl-7">
                  {/* Trục thời gian */}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-4 left-[7px] size-2.5 rounded-full ring-4 ring-card',
                      i === 0 ? 'bg-primary' : 'bg-border-strong',
                    )}
                  />
                  {i < (versions.data?.length ?? 0) - 1 && (
                    <span aria-hidden className="bg-border absolute top-7 bottom-[-16px] left-[11px] w-px" />
                  )}
                  <div className={cn('bg-card rounded-[10px] border p-3 transition-colors', i === 0 && 'border-primary/30 bg-primary-soft/40')}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">Phiên bản {v.version}</span>
                      {i === 0 && <Pill tone="primary">Hiện hành</Pill>}
                      <Button variant="ghost" size="icon-sm" className="ml-auto" asChild>
                        <a href={fileUrl(v.id, true)} download aria-label={`Tải phiên bản ${v.version}`}>
                          <Download strokeWidth={1.8} />
                        </a>
                      </Button>
                    </div>
                    <p className="text-text-secondary mt-0.5 truncate text-xs" title={v.fileName}>
                      {v.fileName} · {fileSize(v.size)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <UserAvatar user={v.uploader} className="size-5" />
                      <span className="font-medium">{v.uploader.name}</span>
                      <span className="text-muted-foreground" title={fmtDateTime(v.createdAt)}>
                        {fromNow(v.createdAt)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        {file && onUploadVersion && (
          <div className="border-t p-4">
            <Button variant="outline" className="w-full" onClick={() => onUploadVersion(file)}>
              <Upload strokeWidth={1.8} />
              Tải phiên bản mới
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
