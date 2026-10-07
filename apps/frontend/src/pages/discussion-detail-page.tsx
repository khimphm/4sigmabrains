import { ArrowLeft, Pin, PinOff, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AttachmentList } from '@/components/attachment-list'
import { CommentThread } from '@/components/comment-thread'
import { RichText } from '@/components/mention-textarea'
import { PageContainer } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useDiscussion, useDiscussionActions } from '@/features/discussions/api'
import { errorMessage } from '@/lib/api'
import { fmtDateTime } from '@/lib/format'

export function DiscussionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, isManager } = useAuth()
  const { data: d, isLoading } = useDiscussion(id)
  const { reply, removeReply, update, remove } = useDiscussionActions(id)

  if (isLoading || !d) {
    return (
      <PageContainer>
        <Skeleton className="h-64 rounded-xl" />
      </PageContainer>
    )
  }
  const canEdit = d.authorId === user?.id || isManager

  return (
    <PageContainer>
      <Link to="/discussions" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Thảo luận
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <article className="bg-card rounded-xl border p-6">
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-xl font-semibold tracking-tight">{d.title}</h1>
            {canEdit && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => update.mutate({ pinned: !d.pinned })} aria-label={d.pinned ? 'Bỏ ghim' : 'Ghim'}>
                  {d.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:text-red-600"
                  aria-label="Xoá"
                  onClick={() =>
                    confirm('Xoá chủ đề này?') &&
                    remove.mutate(undefined, { onSuccess: () => navigate('/discussions'), onError: (e) => toast.error(errorMessage(e)) })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <UserAvatar user={d.author} className="size-7" />
            <span className="font-medium">{d.author.name}</span>
            <span className="text-muted-foreground text-xs">{fmtDateTime(d.createdAt)}</span>
          </div>
          <RichText text={d.body} mentionIds={d.mentionIds} className="mt-5 text-[15px] leading-relaxed" />
          <div className="mt-8 border-t pt-6">
            <h2 className="mb-4 text-sm font-semibold">{d.replyCount} trả lời</h2>
            <CommentThread
              comments={d.replies ?? []}
              submitting={reply.isPending}
              placeholder="Viết trả lời… gõ @ để nhắc tên"
              onSubmit={(data) => reply.mutateAsync(data).catch((e) => toast.error(errorMessage(e)))}
              onDelete={(rid) => removeReply.mutate(rid)}
            />
          </div>
        </article>
        <aside className="space-y-4">
          <div className="bg-card rounded-xl border p-4 text-sm">
            <div className="text-muted-foreground text-xs">Thuộc</div>
            {d.project ? (
              <Link to={`/projects/${d.project.id}`} className="mt-1 flex items-center gap-2 font-medium hover:underline">
                <span className="size-2.5 rounded-[3px]" style={{ background: d.project.color }} />
                {d.project.name}
              </Link>
            ) : (
              <div className="mt-1 font-medium">Chung toàn công ty</div>
            )}
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="mb-3 text-sm font-semibold">Tài liệu</div>
            <AttachmentList target="DISCUSSION" targetId={d.id} />
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}
