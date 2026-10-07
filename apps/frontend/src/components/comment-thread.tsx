import { Loader2, MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/use-auth'
import { useUsers } from '@/features/users/api'
import { fmtDate, fmtDateTime } from '@/lib/format'
import type { Comment } from '@/types/api'
import { MentionTextarea, RichText, useMentionState } from './mention-textarea'
import { UserAvatar } from './user-avatar'

type CommentInput = { body: string; mentionIds: string[] }

export function CommentThread({
  comments,
  onSubmit,
  onDelete,
  onEdit,
  onAttach,
  submitting,
  placeholder,
  emptyText = 'Chưa có trao đổi nào. Hãy là người mở đầu.',
}: {
  comments: Comment[]
  onSubmit: (data: CommentInput) => Promise<unknown>
  onDelete?: (id: string) => void
  // Chỉ hiện "Sửa" khi nơi dùng có API sửa bình luận
  onEdit?: (id: string, data: CommentInput) => Promise<unknown>
  onAttach?: (files: FileList) => void
  submitting?: boolean
  placeholder?: string
  emptyText?: string
}) {
  const { user } = useAuth()
  const state = useMentionState()
  const [removing, setRemoving] = useState<Comment | null>(null)

  const submit = async () => {
    if (!state.value.trim() || submitting) return
    try {
      await onSubmit({ body: state.value.trim(), mentionIds: state.mentionIds })
      state.reset()
    } catch {
      // Giữ nguyên nội dung để người dùng gửi lại
    }
  }

  return (
    <div className="space-y-5">
      {comments.length === 0 && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <MessageSquare className="size-4" strokeWidth={1.8} aria-hidden />
          {emptyText}
        </p>
      )}
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          mine={c.authorId === user?.id}
          onEdit={onEdit}
          onDelete={onDelete ? () => setRemoving(c) : undefined}
        />
      ))}
      <div className="flex gap-3">
        {user && <UserAvatar user={user} className="mt-1 hidden size-9 sm:flex" />}
        <div className="min-w-0 flex-1">
          <MentionTextarea
            variant="boxed"
            rows={2}
            state={state}
            onSubmit={submit}
            onAttach={onAttach}
            placeholder={placeholder ?? 'Viết trao đổi, gõ @ để nhắc tên thành viên…'}
            actions={
              <Button size="sm" onClick={submit} disabled={!state.value.trim() || submitting} className="min-w-16">
                {submitting && <Loader2 className="animate-spin" />}
                Gửi
              </Button>
            }
          />
        </div>
      </div>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bình luận?</AlertDialogTitle>
            <AlertDialogDescription>Bình luận sẽ bị xoá khỏi cuộc trao đổi và không khôi phục được.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => removing && onDelete?.(removing.id)}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CommentItem({
  comment: c,
  mine,
  onEdit,
  onDelete,
}: {
  comment: Comment
  mine: boolean
  onEdit?: (id: string, data: CommentInput) => Promise<unknown>
  onDelete?: () => void
}) {
  const { isManager } = useAuth()
  const [editing, setEditing] = useState(false)
  const canEdit = !!onEdit && mine
  const canDelete = !!onDelete && (mine || isManager)

  return (
    <div className="group flex gap-3">
      <UserAvatar user={c.author} className="mt-0.5 size-9" />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 items-center gap-2">
          <span className="text-sm font-semibold">{c.author.name}</span>
          <time className="text-muted-foreground text-[13px]" dateTime={c.createdAt} title={fmtDateTime(c.createdAt)}>
            {fmtDate(c.createdAt, 'dd/MM, HH:mm')}
          </time>
          {(canEdit || canDelete) && !editing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="ml-auto opacity-100 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 md:opacity-0"
                  aria-label="Thao tác bình luận"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onSelect={() => setEditing(true)}>
                    <Pencil /> Sửa
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 /> Xoá
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {editing && onEdit ? (
          <EditComment comment={c} onCancel={() => setEditing(false)} onSave={(d) => onEdit(c.id, d).then(() => setEditing(false))} />
        ) : (
          <RichText text={c.body} mentionIds={c.mentionIds} className="text-foreground mt-0.5 text-[15px] leading-relaxed" />
        )}
      </div>
    </div>
  )
}

function EditComment({
  comment,
  onSave,
  onCancel,
}: {
  comment: Comment
  onSave: (d: CommentInput) => Promise<unknown>
  onCancel: () => void
}) {
  const { data: users = [] } = useUsers()
  const state = useMentionState({ value: comment.body, mentioned: users.filter((u) => comment.mentionIds.includes(u.id)) })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!state.value.trim()) return
    setSaving(true)
    await onSave({ body: state.value.trim(), mentionIds: state.mentionIds }).finally(() => setSaving(false))
  }
  return (
    <div className="mt-1">
      <MentionTextarea
        variant="boxed"
        rows={2}
        autoFocus
        state={state}
        onSubmit={save}
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Huỷ
            </Button>
            <Button size="sm" onClick={save} disabled={saving || !state.value.trim()}>
              {saving && <Loader2 className="animate-spin" />}
              Lưu
            </Button>
          </>
        }
      />
    </div>
  )
}
