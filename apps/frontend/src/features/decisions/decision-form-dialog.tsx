import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { MentionTextarea, useMentionState } from '@/components/mention-textarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjects } from '@/features/projects/api'
import { errorMessage } from '@/lib/api'
import { fromLocalInput, toLocalInput } from '@/lib/format'
import type { DecisionDetail } from '@/types/api'
import { useCreateDecision, useDecisionActions } from './api'

const GENERAL = '__general__'

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

// Tạo mới (không truyền decision) hoặc sửa chủ đề
export function DecisionFormDialog({
  open,
  onOpenChange,
  decision,
  defaultProjectId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  decision?: DecisionDetail
  defaultProjectId?: string | null
  onCreated?: (d: DecisionDetail) => void
}) {
  const { data: projects = [] } = useProjects()
  const create = useCreateDecision()
  const { update } = useDecisionActions(decision?.id ?? '')
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(GENERAL)
  const [due, setDue] = useState('')
  const context = useMentionState()

  useEffect(() => {
    if (!open) return
    setTitle(decision?.title ?? '')
    setProjectId(decision ? (decision.projectId ?? GENERAL) : (defaultProjectId ?? GENERAL))
    setDue(toLocalInput(decision?.dueDate ?? null))
    context.reset()
    if (decision) context.setValue(decision.context)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo khi mở hộp thoại
  }, [open])

  const pending = create.isPending || update.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 2) return toast.error('Tiêu đề cần ít nhất 2 ký tự')
    if (!context.value.trim()) return toast.error('Nhập bối cảnh / vấn đề cần thống nhất')
    const dueDate = fromLocalInput(due)
    if (decision) {
      update.mutate(
        { title: title.trim(), context: context.value.trim(), dueDate },
        {
          onSuccess: () => (toast.success('Đã lưu chủ đề'), onOpenChange(false)),
          onError: (err) => toast.error(errorMessage(err)),
        },
      )
      return
    }
    create.mutate(
      { title: title.trim(), context: context.value.trim(), dueDate, projectId: projectId === GENERAL ? null : projectId },
      {
        onSuccess: (d) => {
          toast.success('Đã mở chủ đề, mọi người sẽ nhận thông báo mời góp ý')
          onOpenChange(false)
          onCreated?.(d)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{decision ? 'Sửa chủ đề' : 'Chủ đề mới cần chốt'}</DialogTitle>
            <DialogDescription>
              {decision
                ? 'Cập nhật tiêu đề, bối cảnh hoặc hạn chốt.'
                : 'Nêu rõ vấn đề cần thống nhất. Thành viên dự án (hoặc cả công ty) sẽ được mời góp ý.'}
            </DialogDescription>
          </DialogHeader>
          <Field label="Tiêu đề" htmlFor="decision-title">
            <Input
              id="decision-title"
              required
              autoFocus
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Quy trình gán nhãn dữ liệu đợt 2"
              className="h-10"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thuộc dự án">
              <Select value={projectId} onValueChange={setProjectId} disabled={!!decision}>
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
            </Field>
            <Field label="Hạn chốt" htmlFor="decision-due">
              <Input id="decision-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
          <Field label="Bối cảnh" hint="Gõ @ để nhắc tên người cần đọc.">
            <MentionTextarea state={context} rows={6} placeholder="Vấn đề là gì, vì sao cần chốt, có ràng buộc gì…" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Huỷ
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {decision ? 'Lưu' : 'Mở chủ đề'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
