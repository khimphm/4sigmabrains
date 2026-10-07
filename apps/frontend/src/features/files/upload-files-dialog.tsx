import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjects } from '@/features/projects/api'
import { errorMessage } from '@/lib/api'

import { useUploadFile } from './api'
import { Dropzone } from './dropzone'

// Tải tệp lên thư viện: gắn vào dự án (đích PROJECT)
export function UploadFilesDialog({ open, onOpenChange, projectId, defaultProjectId }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Cố định dự án (trong tab dự án)
  projectId?: string
  defaultProjectId?: string
}) {
  const projects = useProjects()
  const upload = useUploadFile()
  const [files, setFiles] = useState<File[]>([])
  const [project, setProject] = useState(defaultProjectId ?? '')
  const [shared, setShared] = useState(false)
  const [status, setStatus] = useState<Record<number, 'pending' | 'uploading' | 'done' | 'error'>>({})
  const [busy, setBusy] = useState(false)
  const target = projectId ?? project

  const reset = () => {
    setFiles([])
    setStatus({})
    setShared(false)
  }

  const submit = async () => {
    if (!target || !files.length) return
    setBusy(true)
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      if (status[i] === 'done') continue
      setStatus((s) => ({ ...s, [i]: 'uploading' }))
      try {
        await upload.mutateAsync({ target: 'PROJECT', targetId: target, file: files[i], shared })
        setStatus((s) => ({ ...s, [i]: 'done' }))
        ok++
      } catch (e) {
        setStatus((s) => ({ ...s, [i]: 'error' }))
        toast.error(`${files[i].name}: ${errorMessage(e)}`)
      }
    }
    setBusy(false)
    if (ok) toast.success(`Đã tải lên ${ok} tệp`)
    if (ok === files.length) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tải tệp lên</DialogTitle>
          <DialogDescription>Bản vẽ, hồ sơ, bảng tính… sẽ được lưu vào thư viện của dự án.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!projectId && (
            <div className="space-y-1.5">
              <Label htmlFor="upload-project">Dự án</Label>
              <Select value={project} onValueChange={setProject} disabled={busy}>
                <SelectTrigger id="upload-project" className="w-full">
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projects.data?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Dropzone files={files} onChange={(f) => { setFiles(f); setStatus({}) }} disabled={busy} status={status} hint="PDF, DWG, ảnh, Excel, Word… tối đa 25 MB mỗi tệp" />
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3 transition-colors hover:bg-subtle">
            <Checkbox checked={shared} onCheckedChange={(v) => setShared(v === true)} disabled={busy} className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Chia sẻ với khách hàng</span>
              <span className="text-muted-foreground block text-xs">Khách hàng của dự án sẽ thấy tệp trong cổng khách hàng và nhận thông báo.</span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={busy || !target || !files.length}>
            {busy && <Loader2 className="animate-spin" />}
            {files.length > 1 ? `Tải lên ${files.length} tệp` : 'Tải lên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
