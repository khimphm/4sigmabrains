import { MessagesSquare, Pin, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/empty-state'
import { MentionTextarea, useMentionState } from '@/components/mention-textarea'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { useCreateDiscussion, useDiscussions } from '@/features/discussions/api'
import { useProjects } from '@/features/projects/api'
import { FormField } from '@/features/tasks/task-form-dialog'
import { errorMessage } from '@/lib/api'
import { fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'

const GENERAL = '__general__'

export function DiscussionsPage() {
  const [params, setParams] = useSearchParams()
  const [scope, setScope] = useState<string>('all')
  const { data: projects = [] } = useProjects()
  const { data = [], isLoading } = useDiscussions(scope === 'all' ? undefined : scope === GENERAL ? 'general' : scope)
  const creating = params.get('new') === '1'
  const setCreating = (o: boolean) =>
    setParams((p) => {
      if (o) {
        p.set('new', '1')
      } else {
        p.delete('new')
        p.delete('projectId')
      }
      return p
    })

  return (
    <PageContainer>
      <PageHeader
        title="Thảo luận"
        description="Trao đổi theo chủ đề, gõ @ để nhắc tên đồng đội"
        actions={
          <>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value={GENERAL}>Chung toàn công ty</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreating(true)}>
              <Plus /> Chủ đề mới
            </Button>
          </>
        }
      />
      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : data.length ? (
        <div className="bg-card divide-y overflow-hidden rounded-xl border">
          {data.map((d) => (
            <Link key={d.id} to={`/discussions/${d.id}`} className="hover:bg-muted/50 flex items-start gap-4 p-4 transition-colors">
              <UserAvatar user={d.author} className="size-9" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {d.pinned && <Pin className="text-primary size-3.5 shrink-0" />}
                  <span className="truncate font-medium">{d.title}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">{d.body}</p>
                <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
                  {d.project ? (
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-[2px]" style={{ background: d.project.color }} />
                      {d.project.name}
                    </span>
                  ) : (
                    <span>Chung</span>
                  )}
                  <span>·</span>
                  <span>{d.author.name}</span>
                  <span>·</span>
                  <span>{fromNow(d.lastActivityAt)}</span>
                </div>
              </div>
              <span className={cn('flex items-center gap-1 rounded-full px-2 py-1 text-xs', d.replyCount ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
                <MessagesSquare className="size-3.5" />
                {d.replyCount}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="Chưa có thảo luận"
          description="Mở chủ đề đầu tiên để cả đội cùng trao đổi."
          action={<Button onClick={() => setCreating(true)}><Plus /> Chủ đề mới</Button>}
        />
      )}
      <NewDiscussionDialog open={creating} onOpenChange={setCreating} defaultProjectId={params.get('projectId')} />
    </PageContainer>
  )
}

function NewDiscussionDialog({ open, onOpenChange, defaultProjectId }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultProjectId: string | null
}) {
  const navigate = useNavigate()
  const create = useCreateDiscussion()
  const { data: projects = [] } = useProjects()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(GENERAL)
  const body = useMentionState()
  useEffect(() => {
    if (open) {
      setTitle('')
      setProjectId(defaultProjectId ?? GENERAL)
      body.reset()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi mở hộp thoại
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!body.value.trim()) return toast.error('Nhập nội dung')
    create.mutate(
      { title, body: body.value.trim(), mentionIds: body.mentionIds, projectId: projectId === GENERAL ? null : projectId },
      {
        onSuccess: (d) => (onOpenChange(false), navigate(`/discussions/${d.id}`)),
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Chủ đề thảo luận mới</DialogTitle>
            <DialogDescription>Người được @nhắc tên sẽ nhận thông báo ngay.</DialogDescription>
          </DialogHeader>
          <Input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" className="h-11 text-base" />
          <FormField label="Thuộc">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GENERAL}>Chung toàn công ty</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <MentionTextarea state={body} rows={6} placeholder="Nội dung… gõ @ để nhắc tên" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Đăng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
