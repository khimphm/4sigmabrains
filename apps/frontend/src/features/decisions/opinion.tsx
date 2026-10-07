import { CornerDownRight, HelpCircle, Lightbulb, Loader2, MessageSquareText, Reply, ThumbsUp, Trash2, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { MentionTextarea, RichText, useMentionState } from '@/components/mention-textarea'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { ConfirmDialog } from '@/features/discussions/confirm-dialog'
import { errorMessage } from '@/lib/api'
import { fmtDateTime, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DecisionOpinion, OpinionKind } from '@/types/api'
import { useDecisionActions } from './api'

export const KIND_META: Record<OpinionKind, { label: string; icon: LucideIcon; chip: string; active: string }> = {
  OPINION: {
    label: 'Ý kiến',
    icon: MessageSquareText,
    chip: 'bg-neutral text-neutral-foreground',
    active: 'bg-foreground text-background border-foreground',
  },
  QUESTION: {
    label: 'Câu hỏi',
    icon: HelpCircle,
    chip: 'bg-due-soon text-due-soon-foreground',
    active: 'bg-due-soon text-due-soon-foreground border-due-soon-foreground/40',
  },
  PROPOSAL: {
    label: 'Đề xuất',
    icon: Lightbulb,
    chip: 'bg-primary-soft text-primary',
    active: 'bg-primary-soft text-primary border-primary/40',
  },
}

export function KindChip({ kind, className }: { kind: OpinionKind; className?: string }) {
  const m = KIND_META[kind]
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold', m.chip, className)}>
      <m.icon className="size-3.5" strokeWidth={1.8} aria-hidden />
      {m.label}
    </span>
  )
}

function AgreeButton({ opinion, decisionId, disabled, small }: { opinion: DecisionOpinion; decisionId: string; disabled: boolean; small?: boolean }) {
  const { agree } = useDecisionActions(decisionId)
  const pending = agree.isPending && agree.variables === opinion.id
  const names = opinion.agreedBy.map((u) => u.name)
  const btn = (
    <Button
      type="button"
      variant="outline"
      size={small ? 'xs' : 'sm'}
      aria-pressed={opinion.agreedByMe}
      disabled={disabled || pending}
      onClick={() => agree.mutate(opinion.id, { onError: (e) => toast.error(errorMessage(e)) })}
      className={cn(
        'cursor-pointer font-semibold transition-colors duration-150',
        opinion.agreedByMe && 'border-primary/40 bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary dark:bg-primary-soft',
      )}
    >
      {pending ? <Loader2 className="animate-spin" /> : <ThumbsUp strokeWidth={1.8} className={cn(opinion.agreedByMe && 'fill-current/20')} />}
      Đồng ý <span className="num">({opinion.agreeCount})</span>
    </Button>
  )
  if (!names.length) return btn
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{btn}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <div className="font-semibold">Đã đồng ý</div>
        <div>{names.join(', ')}</div>
      </TooltipContent>
    </Tooltip>
  )
}

function DeleteOpinion({ opinion, decisionId }: { opinion: DecisionOpinion; decisionId: string }) {
  const { removeOpinion } = useDecisionActions(decisionId)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Xoá ý kiến"
        className="text-muted-foreground hover:text-destructive cursor-pointer opacity-0 transition-opacity group-hover/op:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Xoá ý kiến này?"
        description={opinion.replies?.length ? `Các câu trả lời (${opinion.replies.length}) cũng bị xoá theo.` : 'Không thể hoàn tác.'}
        confirmLabel="Xoá"
        pending={removeOpinion.isPending}
        onConfirm={() =>
          removeOpinion.mutate(opinion.id, {
            onSuccess: () => (setOpen(false), toast.success('Đã xoá ý kiến')),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </>
  )
}

function Header({ opinion, decisionId, canDelete, kind }: { opinion: DecisionOpinion; decisionId: string; canDelete: boolean; kind?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate text-sm font-semibold">{opinion.author.name}</span>
      <time dateTime={opinion.createdAt} title={fmtDateTime(opinion.createdAt)} className="text-muted-foreground shrink-0 text-[13px]">
        {fromNow(opinion.createdAt)}
      </time>
      <span className="ml-auto flex items-center gap-1">
        {canDelete && <DeleteOpinion opinion={opinion} decisionId={decisionId} />}
        {kind && <KindChip kind={opinion.kind} />}
      </span>
    </div>
  )
}

export function OpinionCard({ opinion, decisionId, open: isOpen }: { opinion: DecisionOpinion; decisionId: string; open: boolean }) {
  const { user, isManager } = useAuth()
  const [replying, setReplying] = useState(false)
  const can = (o: DecisionOpinion) => isOpen && (o.authorId === user?.id || isManager)
  const replies = opinion.replies ?? []

  return (
    <article id={`opinion-${opinion.id}`} className="bg-card shadow-card scroll-mt-20 rounded-[10px] border p-4 transition-shadow duration-200 target:ring-primary/40 target:ring-2 sm:p-5">
      <div className="group/op flex gap-3">
        <UserAvatar user={opinion.author} className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <Header opinion={opinion} decisionId={decisionId} canDelete={can(opinion)} kind />
          <RichText text={opinion.body} mentionIds={opinion.mentionIds} className="mt-2 text-[15px] leading-relaxed" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AgreeButton opinion={opinion} decisionId={decisionId} disabled={!isOpen} />
            {isOpen && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-text-secondary cursor-pointer"
                aria-expanded={replying}
                onClick={() => setReplying((r) => !r)}
              >
                <Reply strokeWidth={1.8} /> Trả lời
              </Button>
            )}
            {replies.length > 0 && <span className="text-muted-foreground ml-auto text-[13px]">{replies.length} trả lời</span>}
          </div>
        </div>
      </div>

      {(replies.length > 0 || replying) && (
        <div className="border-border mt-4 ml-4 space-y-4 border-l-2 pl-4 sm:ml-11">
          {replies.map((r) => (
            <div key={r.id} id={`opinion-${r.id}`} className="group/op flex gap-2.5">
              <UserAvatar user={r.author} className="size-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <Header opinion={r} decisionId={decisionId} canDelete={can(r)} />
                <RichText text={r.body} mentionIds={r.mentionIds} className="mt-1 leading-relaxed" />
                <div className="mt-2">
                  <AgreeButton opinion={r} decisionId={decisionId} disabled={!isOpen} small />
                </div>
              </div>
            </div>
          ))}
          {replying && <ReplyComposer decisionId={decisionId} parent={opinion} onDone={() => setReplying(false)} />}
        </div>
      )}
    </article>
  )
}

function ReplyComposer({ decisionId, parent, onDone }: { decisionId: string; parent: DecisionOpinion; onDone: () => void }) {
  const { addOpinion } = useDecisionActions(decisionId)
  const state = useMentionState()
  const submit = () => {
    if (!state.value.trim()) return
    addOpinion.mutate(
      { body: state.value.trim(), parentId: parent.id, mentionIds: state.mentionIds },
      { onSuccess: () => (state.reset(), onDone()), onError: (e) => toast.error(errorMessage(e)) },
    )
  }
  return (
    <div className="flex gap-2.5">
      <CornerDownRight className="text-muted-foreground mt-2 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        <MentionTextarea state={state} rows={2} onSubmit={submit} placeholder={`Trả lời ${parent.author.name}… gõ @ để nhắc tên`} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Huỷ
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={submit} disabled={!state.value.trim() || addOpinion.isPending}>
            {addOpinion.isPending && <Loader2 className="animate-spin" />}
            Gửi trả lời
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OpinionComposer({ decisionId }: { decisionId: string }) {
  const { addOpinion } = useDecisionActions(decisionId)
  const { user } = useAuth()
  const [kind, setKind] = useState<OpinionKind>('OPINION')
  const state = useMentionState()
  const submit = () => {
    if (!state.value.trim()) return
    addOpinion.mutate(
      { body: state.value.trim(), kind, mentionIds: state.mentionIds },
      {
        onSuccess: () => {
          state.reset()
          setKind('OPINION')
          toast.success(`Đã gửi ${KIND_META[kind].label.toLowerCase()}`)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }
  return (
    <div className="bg-card shadow-card rounded-[10px] border p-4">
      <div className="flex items-center gap-3">
        {user && <UserAvatar user={user} className="size-7 max-sm:hidden" />}
        <div role="radiogroup" aria-label="Loại góp ý" className="flex flex-wrap gap-1.5">
          {(Object.keys(KIND_META) as OpinionKind[]).map((k) => {
            const m = KIND_META[k]
            const on = kind === k
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setKind(k)}
                className={cn(
                  'focus-visible:ring-ring/50 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                  on ? m.active : 'border-border-strong text-text-secondary hover:bg-subtle',
                )}
              >
                <m.icon className="size-3.5" strokeWidth={1.8} aria-hidden />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-3">
        <MentionTextarea
          state={state}
          rows={3}
          onSubmit={submit}
          className="bg-background/40"
          placeholder={
            kind === 'QUESTION' ? 'Đặt câu hỏi cho nhóm…' : kind === 'PROPOSAL' ? 'Đề xuất phương án cụ thể…' : 'Viết ý kiến của bạn… gõ @ để nhắc tên'
          }
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs max-sm:hidden">Ctrl + Enter để gửi</span>
        <Button type="button" onClick={submit} disabled={!state.value.trim() || addOpinion.isPending} className="ml-auto">
          {addOpinion.isPending && <Loader2 className="animate-spin" />}
          Gửi {KIND_META[kind].label.toLowerCase()}
        </Button>
      </div>
    </div>
  )
}
