import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { fromNow } from '@/lib/format'
import type { Comment } from '@/types/api'
import { MentionTextarea, RichText, useMentionState } from './mention-textarea'
import { UserAvatar } from './user-avatar'

export function CommentThread({ comments, onSubmit, onDelete, submitting, placeholder }: {
  comments: Comment[]
  onSubmit: (data: { body: string; mentionIds: string[] }) => Promise<unknown>
  onDelete?: (id: string) => void
  submitting?: boolean
  placeholder?: string
}) {
  const { user, isManager } = useAuth()
  const state = useMentionState()

  const submit = async () => {
    if (!state.value.trim()) return
    await onSubmit({ body: state.value.trim(), mentionIds: state.mentionIds })
    state.reset()
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="group flex gap-3">
          <UserAvatar user={c.author} className="mt-0.5 size-8" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{c.author.name}</span>
              <span className="text-muted-foreground text-xs">{fromNow(c.createdAt)}</span>
              {onDelete && (c.authorId === user?.id || isManager) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-7 opacity-0 group-hover:opacity-100"
                  onClick={() => onDelete(c.id)}
                  aria-label="Xoá"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
            <RichText text={c.body} mentionIds={c.mentionIds} className="text-foreground/90 mt-1" />
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        {user && <UserAvatar user={user} className="mt-0.5 size-8" />}
        <div className="flex-1 space-y-2">
          <MentionTextarea state={state} onSubmit={submit} placeholder={placeholder} />
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={!state.value.trim() || submitting}>
              Gửi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
