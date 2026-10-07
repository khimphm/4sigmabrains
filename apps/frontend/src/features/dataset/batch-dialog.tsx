import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/features/projects/api'
import { errorMessage } from '@/lib/api'

import { useSaveBatch, type DrawingBatch } from './api'

const NONE = '__none'

// Tạo / sửa đợt bản vẽ. Mount lại theo key để reset form.
export function BatchDialog({ open, onOpenChange, batch, onSaved }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch?: DrawingBatch | null
  onSaved?: (b: DrawingBatch) => void
}) {
  const projects = useProjects()
  const save = useSaveBatch()
  const [name, setName] = useState(batch?.name ?? '')
  const [description, setDescription] = useState(batch?.description ?? '')
  const [projectId, setProjectId] = useState(batch?.projectId ?? '')
  const valid = name.trim().length >= 2

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    save.mutate(
      { id: batch?.id, name: name.trim(), description: description.trim() || null, projectId: projectId || null },
      {
        onSuccess: (b) => {
          toast.success(batch ? 'Đã lưu đợt bản vẽ' : 'Đã tạo đợt bản vẽ')
          onSaved?.(b)
          onOpenChange(false)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{batch ? 'Sửa đợt bản vẽ' : 'Tạo đợt bản vẽ'}</DialogTitle>
            <DialogDescription>Gom các bản vẽ cùng nguồn để gán nhãn và theo dõi tiến độ theo đợt.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="batch-name">Tên đợt</Label>
            <Input id="batch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Đợt 1, bản vẽ kết cấu" autoFocus maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch-project">Dự án nguồn (không bắt buộc)</Label>
            <Select value={projectId || NONE} onValueChange={(v) => setProjectId(v === NONE ? '' : v)}>
              <SelectTrigger id="batch-project" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Không gắn dự án</SelectItem>
                {projects.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch-desc">Mô tả</Label>
            <Textarea id="batch-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Nguồn bản vẽ, phạm vi, lưu ý cho người gán nhãn…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={!valid || save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {batch ? 'Lưu' : 'Tạo đợt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
