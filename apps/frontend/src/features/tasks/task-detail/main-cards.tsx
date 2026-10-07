import { toast } from 'sonner'

import { AttachmentList } from '@/components/attachment-list'
import { CommentThread } from '@/components/comment-thread'
import { Skeleton } from '@/components/ui/skeleton'
import { useAttachmentList, useUploadAttachment } from '@/features/attachments'
import { errorMessage } from '@/lib/api'
import type { TaskDetail } from '@/types/api'
import { useAddComment, useDeleteComment, useEditComment, useTaskComments } from '../api'
import { SectionCard } from './section-card'

export function AttachmentsCard({ task }: { task: TaskDetail }) {
  const { data } = useAttachmentList('TASK', task.id)
  return (
    <SectionCard
      id="task-files"
      title="Tệp đính kèm"
      aside={data && <span className="text-text-secondary num text-sm">{data.length} tệp</span>}
    >
      <AttachmentList target="TASK" targetId={task.id} />
    </SectionCard>
  )
}

export function CommentsCard({ task }: { task: TaskDetail }) {
  const { data, isLoading } = useTaskComments(task.id)
  const add = useAddComment(task.id)
  const remove = useDeleteComment(task.id)
  const edit = useEditComment(task.id)
  const upload = useUploadAttachment('TASK', task.id)

  const attach = async (files: FileList) => {
    for (const file of Array.from(files))
      await toast
        .promise(upload.mutateAsync(file), {
          loading: `Đang tải ${file.name}…`,
          success: `Đã thêm ${file.name} vào Tệp đính kèm`,
          error: (e) => `Không tải được: ${errorMessage(e)}`,
        })
        .unwrap()
        .catch(() => {})
  }

  return (
    <SectionCard
      id="task-comments"
      title="Trao đổi"
      aside={!!data?.length && <span className="text-text-secondary num text-sm">{data.length} bình luận</span>}
    >
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CommentThread
          comments={data ?? []}
          submitting={add.isPending}
          onSubmit={(d) => add.mutateAsync(d).catch((e) => (toast.error(errorMessage(e)), Promise.reject(e)))}
          onDelete={(id) =>
            remove.mutate(id, {
              onSuccess: () => toast.success('Đã xoá bình luận'),
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
          onEdit={(id, d) => edit.mutateAsync({ id, ...d }).catch((e) => (toast.error(errorMessage(e)), Promise.reject(e)))}
          onAttach={attach}
        />
      )}
    </SectionCard>
  )
}
