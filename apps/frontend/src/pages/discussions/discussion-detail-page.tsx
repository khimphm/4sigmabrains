import { ArrowLeft, Ellipsis, Loader2, MessagesSquare, Paperclip, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AttachmentList } from '@/components/attachment-list'
import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { MentionTextarea, RichText, useMentionState } from '@/components/mention-textarea'
import { PageContainer } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { AvatarStack, UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useDiscussion, useDiscussionActions } from '@/features/discussions/api'
import { ConfirmDialog } from '@/features/discussions/confirm-dialog'
import { errorMessage } from '@/lib/api'
import { fmtDateTime, fromNow } from '@/lib/format'
import type { Comment, Discussion } from '@/types/api'

export function DiscussionDetailPage() {
  const { id = '' } = useParams()
  const { data: d, isLoading, error } = useDiscussion(id)

  return (
    <PageContainer>
      <PageTopbar crumbs={[{ label: 'Thảo luận', to: '/discussions' }, { label: d?.title ?? 'Đang tải…' }]} />
      <Link
        to="/discussions"
        className="text-text-secondary hover:text-foreground mb-4 inline-flex items-center gap-1 rounded-md text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" /> Tất cả thảo luận
      </Link>
      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="bg-card space-y-3 rounded-[10px] border p-6">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-56 rounded-[10px]" />
        </div>
      ) : !d ? (
        <EmptyState icon={MessagesSquare} title="Không tìm thấy thảo luận" description={error ? errorMessage(error) : undefined} />
      ) : (
        <DiscussionView d={d} />
      )}
    </PageContainer>
  )
}

function DiscussionView({ d }: { d: Discussion }) {
  const navigate = useNavigate()
  const { user, isManager } = useAuth()
  const { update, remove } = useDiscussionActions(d.id)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const canEdit = d.authorId === user?.id || isManager
  const replies = useMemo(() => d.replies ?? [], [d.replies])
  const participants = useMemo(() => {
    const map = new Map([[d.author.id, d.author]])
    for (const r of replies) map.set(r.author.id, r.author)
    return [...map.values()]
  }, [d.author, replies])

  const togglePin = () =>
    update.mutate(
      { pinned: !d.pinned },
      { onSuccess: () => toast.success(d.pinned ? 'Đã bỏ ghim' : 'Đã ghim lên đầu'), onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <article className="bg-card shadow-card rounded-[10px] border p-5 sm:p-6">
          {editing ? (
            <EditForm d={d} onDone={() => setEditing(false)} />
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  {d.pinned && (
                    <Pill tone="primary" icon={Pin} className="mb-2">
                      Đã ghim
                    </Pill>
                  )}
                  <h1 className="text-[22px] leading-snug font-bold tracking-tight text-balance">{d.title}</h1>
                </div>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Thao tác với thảo luận" className="cursor-pointer">
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={togglePin}>
                        {d.pinned ? <PinOff /> : <Pin />} {d.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditing(true)}>
                        <Pencil /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                        <Trash2 /> Xoá thảo luận
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2.5 text-sm">
                <UserAvatar user={d.author} className="size-8" />
                <div className="min-w-0">
                  <div className="font-semibold">{d.author.name}</div>
                  <div className="text-muted-foreground text-xs">{fmtDateTime(d.createdAt)}</div>
                </div>
              </div>
              <RichText text={d.body} mentionIds={d.mentionIds} className="mt-5 text-[15px] leading-relaxed" />
            </>
          )}
        </article>

        <section className="bg-card shadow-card rounded-[10px] border p-5 sm:p-6" aria-labelledby="replies-title">
          <h2 id="replies-title" className="text-[17px] font-bold">
            Trả lời <span className="text-muted-foreground num font-semibold">({replies.length})</span>
          </h2>
          {replies.length ? (
            <ol className="mt-4 space-y-5">
              {replies.map((r) => (
                <ReplyItem key={r.id} r={r} discussionId={d.id} />
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">Chưa có trả lời. Hãy là người đầu tiên.</p>
          )}
          <ReplyComposer discussionId={d.id} />
        </section>
      </div>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
        <section className="bg-card shadow-card rounded-[10px] border p-5 text-sm">
          <h2 className="mb-3 text-sm font-bold">Thông tin</h2>
          <dl className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Thuộc</dt>
              <dd className="min-w-0 text-right">
                {d.project ? (
                  <Link to={`/projects/${d.project.id}`} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                    <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.project.color }} aria-hidden />
                    <span className="truncate">{d.project.name}</span>
                  </Link>
                ) : (
                  <span className="font-medium">Chung toàn công ty</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Hoạt động</dt>
              <dd title={fmtDateTime(d.lastActivityAt)}>{fromNow(d.lastActivityAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Trả lời</dt>
              <dd className="num font-medium">{d.replyCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Tham gia</dt>
              <dd>
                <AvatarStack users={participants} max={5} />
              </dd>
            </div>
          </dl>
        </section>
        <section className="bg-card shadow-card rounded-[10px] border p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <Paperclip className="size-4" strokeWidth={1.8} aria-hidden /> Tài liệu đính kèm
          </h2>
          <AttachmentList target="DISCUSSION" targetId={d.id} />
        </section>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xoá thảo luận này?"
        description="Toàn bộ trả lời cũng bị xoá. Không thể hoàn tác."
        confirmLabel="Xoá"
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => (toast.success('Đã xoá thảo luận'), navigate('/discussions', { replace: true })),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  )
}

function EditForm({ d, onDone }: { d: Discussion; onDone: () => void }) {
  const { update } = useDiscussionActions(d.id)
  const [title, setTitle] = useState(d.title)
  const [body, setBody] = useState(d.body)
  const save = () => {
    if (title.trim().length < 2 || !body.trim()) return toast.error('Nhập tiêu đề và nội dung')
    update.mutate(
      { title: title.trim(), body: body.trim() },
      { onSuccess: () => (toast.success('Đã lưu'), onDone()), onError: (e) => toast.error(errorMessage(e)) },
    )
  }
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="edit-title" className="text-[13px] font-semibold">
          Tiêu đề
        </Label>
        <Input id="edit-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className="h-10 text-base font-semibold" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-body" className="text-[13px] font-semibold">
          Nội dung
        </Label>
        <Textarea id="edit-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="text-[15px]" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={update.isPending}>
          Huỷ
        </Button>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending && <Loader2 className="animate-spin" />}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  )
}

function ReplyItem({ r, discussionId }: { r: Comment; discussionId: string }) {
  const { user, isManager } = useAuth()
  const { removeReply } = useDiscussionActions(discussionId)
  const [confirm, setConfirm] = useState(false)
  const canDelete = r.authorId === user?.id || isManager
  return (
    <li className="group flex gap-3">
      <UserAvatar user={r.author} className="mt-0.5 size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{r.author.name}</span>
          <time dateTime={r.createdAt} title={fmtDateTime(r.createdAt)} className="text-muted-foreground text-[13px]">
            {fromNow(r.createdAt)}
          </time>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Xoá trả lời"
              className="text-muted-foreground hover:text-destructive ml-auto cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
              onClick={() => setConfirm(true)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
        <RichText text={r.body} mentionIds={r.mentionIds} className="mt-1 text-[15px] leading-relaxed" />
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Xoá trả lời này?"
        confirmLabel="Xoá"
        pending={removeReply.isPending}
        onConfirm={() =>
          removeReply.mutate(r.id, {
            onSuccess: () => (setConfirm(false), toast.success('Đã xoá trả lời')),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </li>
  )
}

function ReplyComposer({ discussionId }: { discussionId: string }) {
  const { user } = useAuth()
  const { reply } = useDiscussionActions(discussionId)
  const state = useMentionState()
  const submit = () => {
    if (!state.value.trim()) return
    reply.mutate({ body: state.value.trim(), mentionIds: state.mentionIds }, { onSuccess: () => state.reset(), onError: (e) => toast.error(errorMessage(e)) })
  }
  return (
    <div className="mt-6 flex gap-3 border-t pt-5">
      {user && <UserAvatar user={user} className="mt-0.5 size-8 shrink-0 max-sm:hidden" />}
      <div className="min-w-0 flex-1 space-y-2">
        <MentionTextarea state={state} rows={3} onSubmit={submit} placeholder="Viết trả lời… gõ @ để nhắc tên, Ctrl+Enter để gửi" />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={!state.value.trim() || reply.isPending}>
            {reply.isPending && <Loader2 className="animate-spin" />}
            Gửi trả lời
          </Button>
        </div>
      </div>
    </div>
  )
}
