import { ArrowLeft, Check, Crown, Plus, RotateCcw, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { PageContainer } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { AvatarStack, UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { type OptionInput, useDecision, useDecisionActions } from '@/features/decisions/api'
import { errorMessage } from '@/lib/api'
import { DECISION_STATUS_META } from '@/lib/constants'
import { dueLabel, fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { OptionEditor } from './decision-new-page'

export function DecisionDetailPage() {
  const { id = '' } = useParams()
  const { user, isManager } = useAuth()
  const { data: d, isLoading } = useDecision(id)
  const actions = useDecisionActions(id)
  const [comment, setComment] = useState('')
  const [deciding, setDeciding] = useState<string | null>(null)
  const [rationale, setRationale] = useState('')
  const [adding, setAdding] = useState<OptionInput | null>(null)
  const onError = (e: unknown) => toast.error(errorMessage(e))

  if (isLoading || !d) {
    return (
      <PageContainer>
        <Skeleton className="h-96 rounded-xl" />
      </PageContainer>
    )
  }

  const votes = d.votes ?? []
  const myVote = votes.find((v) => v.userId === user?.id)
  const canManage = d.ownerId === user?.id || isManager
  const open = d.status === 'OPEN'
  const maxVotes = Math.max(1, ...d.options.map((o) => votes.filter((v) => v.optionId === o.id).length))
  const chosen = d.options.find((o) => o.id === d.chosenOptionId)

  return (
    <PageContainer>
      <Link to="/decisions" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Phân tích & quyết định
      </Link>

      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', DECISION_STATUS_META[d.status].badge)}>{DECISION_STATUS_META[d.status].label}</span>
          {open && d.dueDate && <span className="text-muted-foreground text-xs">Hạn chốt: {dueLabel(d.dueDate)}</span>}
          {d.project && (
            <Link to={`/projects/${d.project.id}`} className="text-muted-foreground flex items-center gap-1 text-xs hover:underline">
              <span className="size-2 rounded-[2px]" style={{ background: d.project.color }} />
              {d.project.name}
            </Link>
          )}
          {canManage && (
            <div className="ml-auto flex gap-2">
              {open ? (
                <Button variant="ghost" size="sm" onClick={() => confirm('Huỷ quyết định này?') && actions.cancel.mutate(undefined, { onError })}>
                  <XCircle /> Huỷ
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => actions.reopen.mutate(undefined, { onError })}>
                  <RotateCcw /> Mở lại
                </Button>
              )}
            </div>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{d.title}</h1>
        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
          <UserAvatar user={d.owner} className="size-6" />
          {d.owner.name} · {fmtDateTime(d.createdAt)}
        </div>
        <p className="mt-5 text-[15px] leading-relaxed whitespace-pre-wrap">{d.context}</p>
      </div>

      {chosen && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <Crown className="size-4" /> Đã chốt: {chosen.title}
          </div>
          {d.rationale && <p className="mt-2 text-sm whitespace-pre-wrap">{d.rationale}</p>}
          {d.decidedAt && <p className="text-muted-foreground mt-2 text-xs">{fmtDateTime(d.decidedAt)}</p>}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-semibold">
          Phương án <span className="text-muted-foreground font-normal">· {votes.length} phiếu</span>
        </h2>
        {open && (
          <Button variant="outline" size="sm" onClick={() => setAdding({ title: '', description: '', pros: [''], cons: [''] })}>
            <Plus /> Đề xuất phương án
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {d.options.map((o, i) => {
          const optionVotes = votes.filter((v) => v.optionId === o.id)
          const mine = myVote?.optionId === o.id
          const isChosen = d.chosenOptionId === o.id
          return (
            <div key={o.id} className={cn('bg-card flex flex-col rounded-xl border p-5 transition-all', mine && 'border-primary ring-primary/20 ring-2', isChosen && 'border-emerald-500 ring-2 ring-emerald-500/20')}>
              <div className="flex items-start gap-3">
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold', isChosen ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary')}>
                  {isChosen ? <Check className="size-4" /> : String.fromCharCode(65 + i)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{o.title}</h3>
                  {o.description && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{o.description}</p>}
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <ul className="space-y-1.5">
                  {o.pros.map((p, j) => (
                    <li key={j} className="flex gap-2">
                      <ThumbsUp className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      {p}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1.5">
                  {o.cons.map((c, j) => (
                    <li key={j} className="flex gap-2">
                      <ThumbsDown className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto pt-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(optionVotes.length / maxVotes) * 100}%` }} />
                  </div>
                  <span className="text-muted-foreground text-xs tabular-nums">{optionVotes.length} phiếu</span>
                </div>
                <div className="flex items-center gap-2">
                  <AvatarStack users={optionVotes.map((v) => v.user)} max={5} />
                  <div className="ml-auto flex gap-2">
                    {open && (
                      <Button size="sm" variant={mine ? 'default' : 'outline'} onClick={() => actions.vote.mutate({ optionId: o.id, comment: comment || undefined }, { onError })}>
                        {mine ? <><Check /> Đã chọn</> : 'Bình chọn'}
                      </Button>
                    )}
                    {open && canManage && (
                      <Button size="sm" variant="ghost" onClick={() => (setDeciding(o.id), setRationale(''))}>
                        Chốt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {open && (
        <div className="bg-card mt-6 rounded-xl border p-5">
          <h3 className="text-sm font-semibold">Ý kiến của bạn (kèm phiếu bầu)</h3>
          <Textarea className="mt-2" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={myVote?.comment ?? 'Vì sao bạn chọn phương án này?'} />
          <p className="text-muted-foreground mt-2 text-xs">Bấm "Bình chọn" ở phương án bạn ủng hộ để gửi kèm ý kiến. Có thể đổi phiếu khi quyết định còn mở.</p>
        </div>
      )}

      {votes.some((v) => v.comment) && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold">Ý kiến</h3>
          {votes.filter((v) => v.comment).map((v) => {
            const idx = d.options.findIndex((o) => o.id === v.optionId)
            return (
              <div key={v.id} className="bg-card flex gap-3 rounded-xl border p-4">
                <UserAvatar user={v.user} className="size-8" />
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{v.user.name}</span>
                    <span className="text-muted-foreground"> chọn phương án {String.fromCharCode(65 + idx)}</span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{v.comment}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!deciding} onOpenChange={(o) => !o && setDeciding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chốt phương án</DialogTitle>
            <DialogDescription>{d.options.find((o) => o.id === deciding)?.title}</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Lý do chọn, các bước tiếp theo…" autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeciding(null)}>
              Huỷ
            </Button>
            <Button
              disabled={!rationale.trim() || actions.decide.isPending}
              onClick={() =>
                actions.decide.mutate(
                  { optionId: deciding!, rationale },
                  { onSuccess: () => (setDeciding(null), toast.success('Đã chốt quyết định')), onError },
                )
              }
            >
              Chốt quyết định
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adding} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Đề xuất phương án</DialogTitle>
            <DialogDescription>Phương án mới sẽ được thêm vào để mọi người bình chọn.</DialogDescription>
          </DialogHeader>
          {adding && <OptionEditor option={adding} index={d.options.length} onChange={setAdding} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(null)}>
              Huỷ
            </Button>
            <Button
              disabled={!adding?.title.trim()}
              onClick={() =>
                adding &&
                actions.addOption.mutate(
                  { ...adding, pros: adding.pros.filter(Boolean), cons: adding.cons.filter(Boolean) },
                  { onSuccess: () => setAdding(null), onError },
                )
              }
            >
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
