import { CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserSelect } from '@/components/user-select'
import { errorMessage } from '@/lib/api'
import { useReviewDrawing, useSubmitDrawing, type DrawingDetail } from './drawing-api'
import type { ReviewMark } from './drawing-panels'

export function SubmitDialog({
  drawing,
  currentUserId,
  open,
  onOpenChange,
}: {
  drawing: DrawingDetail
  currentUserId: string
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const submit = useSubmitDrawing(drawing.id)
  const [reviewerId, setReviewerId] = useState<string | null>(drawing.reviewerId)

  const labelerId = drawing.labelerId ?? currentUserId
  const sameAsLabeler = !!reviewerId && reviewerId === labelerId
  const count = drawing.annotations.length

  const onSubmit = () =>
    submit.mutate(reviewerId, {
      onSuccess: () => {
        toast.success(`Đã gửi duyệt ${drawing.code}`)
        onOpenChange(false)
      },
      onError: (e) => toast.error(errorMessage(e)),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gửi duyệt bản vẽ {drawing.code}</DialogTitle>
          <DialogDescription>
            {count > 0
              ? `${count} vùng lỗi sẽ được gửi cho người duyệt chéo. Trong lúc chờ duyệt, nhãn không sửa được.`
              : 'Bản vẽ chưa có vùng lỗi nào. Hãy khoanh ít nhất một vùng trước khi gửi duyệt.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reviewer">Người duyệt</Label>
          <div id="reviewer">
            <UserSelect
              value={reviewerId}
              onChange={setReviewerId}
              placeholder="Để quản lý phân công"
              className="w-full"
            />
          </div>
          {sameAsLabeler ? (
            <p className="text-overdue-foreground text-[13px]" role="alert">
              Người duyệt phải khác người gán nhãn (duyệt chéo).
            </p>
          ) : (
            <p className="text-muted-foreground text-[13px]">
              Không chọn ai thì quản lý và quản trị viên sẽ nhận thông báo để phân công.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={onSubmit} disabled={submit.isPending || sameAsLabeler || count === 0}>
            {submit.isPending ? <Loader2 className="animate-spin" /> : <Send />}
            Gửi duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReviewDialog({
  drawing,
  marks,
  open,
  onOpenChange,
  onDone,
}: {
  drawing: DrawingDetail
  marks: Record<string, ReviewMark>
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const review = useReviewDrawing(drawing.id)
  const [note, setNote] = useState('')
  const total = drawing.annotations.length
  const approved = drawing.annotations.filter((a) => marks[a.id]?.status === 'APPROVED').length
  const rejected = drawing.annotations.filter((a) => marks[a.id]?.status === 'REJECTED').length
  const unmarked = total - approved - rejected
  const [pending, setPending] = useState<'APPROVE' | 'REQUEST_CHANGES' | null>(null)

  const send = (decision: 'APPROVE' | 'REQUEST_CHANGES') => {
    setPending(decision)
    review.mutate(
      {
        decision,
        note: note.trim() || undefined,
        annotations: Object.entries(marks)
          .filter(([id]) => drawing.annotations.some((a) => a.id === id))
          .map(([id, m]) => ({ id, status: m.status, reviewNote: m.note.trim() || undefined })),
      },
      {
        onSuccess: () => {
          toast.success(decision === 'APPROVE' ? `Đã duyệt ${drawing.code}` : `Đã trả ${drawing.code} về để sửa nhãn`)
          setNote('')
          onOpenChange(false)
          onDone()
        },
        onError: (e) => toast.error(errorMessage(e)),
        onSettled: () => setPending(null),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duyệt bản vẽ {drawing.code}</DialogTitle>
          <DialogDescription>Kiểm tra chéo các vùng lỗi do {drawing.labeler?.name ?? 'người gán'} khoanh.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              ['Đạt', approved, 'bg-on-time text-on-time-foreground'],
              ['Không đạt', rejected, 'bg-overdue text-overdue-foreground'],
              ['Chưa đánh giá', unmarked, 'bg-neutral text-neutral-foreground'],
            ] as const
          ).map(([label, n, cls]) => (
            <div key={label} className={`rounded-lg px-2 py-3 ${cls}`}>
              <div className="num text-2xl font-extrabold">{n}</div>
              <div className="text-xs font-semibold">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-[13px]">
          {rejected > 0
            ? 'Có vùng không đạt: nên chọn “Yêu cầu sửa” để người gán chỉnh lại.'
            : 'Khi duyệt bản vẽ, các vùng chưa đánh giá được tính là đạt.'}
        </p>
        <div className="space-y-2">
          <Label htmlFor="review-note">Nhận xét chung (không bắt buộc)</Label>
          <Textarea
            id="review-note"
            value={note}
            maxLength={5000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Vd: Bổ sung nhãn thiếu kích thước ở trục 3–4"
            className="min-h-20"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => send('REQUEST_CHANGES')} disabled={!!pending}>
            {pending === 'REQUEST_CHANGES' ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Yêu cầu sửa
          </Button>
          <Button onClick={() => send('APPROVE')} disabled={!!pending || rejected > 0}>
            {pending === 'APPROVE' ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            Duyệt bản vẽ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
