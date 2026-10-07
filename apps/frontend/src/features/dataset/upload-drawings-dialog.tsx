import { Info, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dropzone } from '@/features/files/dropzone'
import { errorMessage } from '@/lib/api'

import { useBatches, useUploadDrawings } from './api'

const MAX = 50
const ALLOWED = /^(application\/pdf|image\/(png|jpe?g|webp))$/

export function UploadDrawingsDialog({ open, onOpenChange, defaultBatchId, onUploaded }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBatchId?: string
  onUploaded?: (batchId: string) => void
}) {
  const batches = useBatches()
  const upload = useUploadDrawings()
  const [batchId, setBatchId] = useState(defaultBatchId ?? '')
  const [files, setFiles] = useState<File[]>([])
  const target = batchId || defaultBatchId || batches.data?.[0]?.id || ''

  const pick = (list: File[]) => {
    const bad = list.filter((f) => !ALLOWED.test(f.type))
    if (bad.length) toast.error(`Bỏ qua ${bad.length} tệp không hợp lệ. Chỉ nhận PDF hoặc ảnh PNG/JPG/WEBP; DWG cần xuất ra PDF trước.`)
    const ok = list.filter((f) => ALLOWED.test(f.type))
    if (ok.length > MAX) toast.warning(`Mỗi lần tải tối đa ${MAX} bản vẽ`)
    setFiles(ok.slice(0, MAX))
  }

  const close = (o: boolean) => {
    if (upload.isPending) return
    if (!o) setFiles([])
    onOpenChange(o)
  }

  const submit = () =>
    upload.mutate(
      { batchId: target, files },
      {
        onSuccess: (rows) => {
          toast.success(`Đã thêm ${rows.length} bản vẽ vào đợt`)
          onUploaded?.(target)
          setFiles([])
          onOpenChange(false)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tải bản vẽ lên</DialogTitle>
          <DialogDescription>Mã bản vẽ lấy theo tên tệp (ví dụ BV-KC-02.pdf → BV-KC-02).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="upload-batch">Đợt bản vẽ</Label>
            <Select value={target} onValueChange={setBatchId} disabled={upload.isPending}>
              <SelectTrigger id="upload-batch" className="w-full">
                <SelectValue placeholder="Chọn đợt" />
              </SelectTrigger>
              <SelectContent>
                {batches.data?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} · {b.total} bản vẽ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dropzone
            files={files}
            onChange={pick}
            accept="application/pdf,image/png,image/jpeg,image/webp"
            max={MAX}
            disabled={upload.isPending}
            hint={`PDF, PNG, JPG, WEBP · tối đa ${MAX} tệp mỗi lần`}
          />
          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Bản vẽ DWG/DXF cần xuất ra PDF trước khi đưa vào dataset.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={upload.isPending}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!target || !files.length || upload.isPending}>
            {upload.isPending && <Loader2 className="animate-spin" />}
            {upload.isPending ? 'Đang tải lên…' : files.length ? `Tải lên ${files.length} bản vẽ` : 'Tải lên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
