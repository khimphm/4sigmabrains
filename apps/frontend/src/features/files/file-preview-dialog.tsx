import { Download, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { fileSize, fmtDateTime } from '@/lib/format'

import { fileUrl, type LibraryFile } from './api'
import { fileKind, KIND_META } from './file-kind'
import { FileThumb } from './file-parts'

export function FilePreviewDialog({ file, onOpenChange }: { file: LibraryFile | null; onOpenChange: (open: boolean) => void }) {
  const kind = file ? fileKind(file.fileName, file.mimeType) : 'other'
  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        {file && (
          <>
            <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
              <DialogTitle className="truncate text-base">{file.fileName}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span>{KIND_META[kind].label}</span>
                <span>Phiên bản {file.version}</span>
                <span>{fileSize(file.size)}</span>
                <span>
                  {file.uploader.name} · {fmtDateTime(file.createdAt)}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="bg-subtle min-h-0 flex-1 overflow-auto">
              {kind === 'pdf' ? (
                <iframe title={file.fileName} src={fileUrl(file.id)} className="h-[72vh] w-full border-0 bg-white" />
              ) : kind === 'image' ? (
                <div className="grid min-h-[50vh] place-items-center p-4">
                  <img src={fileUrl(file.id)} alt={file.fileName} className="max-h-[70vh] max-w-full rounded-md object-contain shadow-card" />
                </div>
              ) : (
                <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 py-14 text-center">
                  <div className="w-48 overflow-hidden rounded-[10px] border">
                    <FileThumb file={file} />
                  </div>
                  <p className="text-text-secondary text-sm">
                    Định dạng này chưa xem trực tiếp được trên trình duyệt. Tải xuống để mở bằng phần mềm chuyên dụng.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
              <Button variant="outline" asChild>
                <a href={fileUrl(file.id)} target="_blank" rel="noreferrer">
                  <ExternalLink strokeWidth={1.8} />
                  Mở tab mới
                </a>
              </Button>
              <Button asChild>
                <a href={fileUrl(file.id, true)} download>
                  <Download strokeWidth={1.8} />
                  Tải xuống
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
