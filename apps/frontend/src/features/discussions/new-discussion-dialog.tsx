import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { MentionTextarea, useMentionState } from '@/components/mention-textarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjects } from '@/features/projects/api'
import { errorMessage } from '@/lib/api'
import { useCreateDiscussion } from './api'

const GENERAL = '__general__'

export function NewDiscussionDialog({
  open,
  onOpenChange,
  defaultProjectId,
  lockProject,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultProjectId?: string | null
  lockProject?: boolean
}) {
  const navigate = useNavigate()
  const create = useCreateDiscussion()
  const { data: projects = [] } = useProjects()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(GENERAL)
  const body = useMentionState()

  useEffect(() => {
    if (!open) return
    setTitle('')
    setProjectId(defaultProjectId ?? GENERAL)
    body.reset()
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi mở hộp thoại
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 2) return toast.error('Tiêu đề cần ít nhất 2 ký tự')
    if (!body.value.trim()) return toast.error('Nhập nội dung thảo luận')
    create.mutate(
      { title: title.trim(), body: body.value.trim(), mentionIds: body.mentionIds, projectId: projectId === GENERAL ? null : projectId },
      {
        onSuccess: (d) => {
          toast.success('Đã đăng thảo luận')
          onOpenChange(false)
          navigate(`/discussions/${d.id}`)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !create.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Thảo luận mới</DialogTitle>
            <DialogDescription>Người được @nhắc tên sẽ nhận thông báo ngay.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="discussion-title" className="text-[13px] font-semibold">
              Tiêu đề
            </Label>
            <Input
              id="discussion-title"
              required
              autoFocus
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Quy ước đặt tên file bản vẽ"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Thuộc</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={lockProject}>
              <SelectTrigger className="w-full" aria-label="Thuộc dự án">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GENERAL}>Chung toàn công ty</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Nội dung</Label>
            <MentionTextarea state={body} rows={6} placeholder="Nội dung… gõ @ để nhắc tên" onSubmit={() => (document.activeElement as HTMLElement)?.closest('form')?.requestSubmit()} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />}
              Đăng thảo luận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
