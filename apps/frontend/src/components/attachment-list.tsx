import { FileText, ImageIcon, Paperclip, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { type AttachmentTarget, useAttachments } from '@/features/attachments'
import { errorMessage } from '@/lib/api'
import { fileSize, fromNow } from '@/lib/format'

export function AttachmentList({ target, targetId }: { target: AttachmentTarget; targetId: string }) {
  const { user, isManager } = useAuth()
  const { list, upload, remove } = useAttachments(target, targetId)
  const input = useRef<HTMLInputElement>(null)

  const onFiles = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      await toast
        .promise(upload.mutateAsync(file), {
          loading: `Đang tải ${file.name}…`,
          success: `Đã tải lên ${file.name}`,
          error: (e) => `Không tải được: ${errorMessage(e)}`,
        })
        .unwrap()
        .catch(() => {})
    }
    if (input.current) input.current.value = ''
  }

  return (
    <div
      className="space-y-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onFiles(e.dataTransfer.files)
      }}
    >
      {list.data?.map((a) => (
        <div key={a.id} className="hover:bg-muted/60 group flex items-center gap-3 rounded-lg border px-3 py-2">
          <span className="bg-muted text-muted-foreground grid size-8 place-items-center rounded-md">
            {a.mimeType.startsWith('image/') ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
          </span>
          <a href={`/api/attachments/${a.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium hover:underline">{a.fileName}</span>
            <span className="text-muted-foreground text-xs">
              {fileSize(a.size)} · {a.uploader.name} · {fromNow(a.createdAt)}
            </span>
          </a>
          {(a.uploader.id === user?.id || isManager) && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100"
              onClick={() => remove.mutate(a.id)}
              aria-label="Xoá file"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      ))}
      <input ref={input} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="text-muted-foreground hover:border-primary/40 hover:text-primary flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm transition-colors"
      >
        {upload.isPending ? <Upload className="size-4 animate-bounce" /> : <Paperclip className="size-4" />}
        Kéo thả file vào đây hoặc bấm để chọn
      </button>
    </div>
  )
}
