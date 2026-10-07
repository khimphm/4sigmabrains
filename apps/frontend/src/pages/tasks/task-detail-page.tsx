import { ArrowLeft, SearchX } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/empty-state'
import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskDetail } from '@/features/tasks/api'
import { ChecklistCard } from '@/features/tasks/task-detail/checklist-card'
import { DescriptionCard } from '@/features/tasks/task-detail/description-card'
import { InfoCard } from '@/features/tasks/task-detail/info-card'
import { AttachmentsCard, CommentsCard } from '@/features/tasks/task-detail/main-cards'
import { taskCode } from '@/features/tasks/task-detail/meta'
import { ActivityCard, RemindersCard, WatchersCard } from '@/features/tasks/task-detail/side-cards'
import { TaskHeader } from '@/features/tasks/task-detail/task-header'
import { ApiError, errorMessage } from '@/lib/api'

// Figma 04 — Chi tiết công việc
export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: task, isLoading, error } = useTaskDetail(id)

  if (error) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400)
    return (
      <PageContainer>
        <PageTopbar crumbs={[{ label: 'Việc của tôi', to: '/my-tasks' }, { label: 'Không tìm thấy' }]} />
        <EmptyState
          icon={SearchX}
          title={notFound ? 'Không tìm thấy công việc' : 'Không mở được công việc'}
          description={notFound ? 'Công việc có thể đã bị xoá hoặc đường dẫn không đúng.' : errorMessage(error)}
          action={
            <Button variant="outline" onClick={() => navigate('/my-tasks')}>
              <ArrowLeft className="size-4" /> Về Việc của tôi
            </Button>
          }
          className="bg-card mt-8"
        />
      </PageContainer>
    )
  }

  if (isLoading || !task) return <DetailSkeleton />

  return (
    <PageContainer>
      <PageTopbar
        crumbs={[
          { label: 'Dự án', to: '/projects' },
          { label: task.project.name, to: `/projects/${task.projectId}` },
          { label: taskCode(task) },
        ]}
        title={`${taskCode(task)} ${task.title}`}
      />
      <TaskHeader task={task} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
        <div className="min-w-0 space-y-5">
          <DescriptionCard task={task} />
          <ChecklistCard task={task} />
          <AttachmentsCard task={task} />
          <CommentsCard task={task} />
        </div>
        <aside className="min-w-0 space-y-5" aria-label="Thông tin công việc">
          <InfoCard task={task} />
          <WatchersCard task={task} />
          <RemindersCard task={task} />
          <ActivityCard task={task} />
          <p className="text-muted-foreground px-1 text-xs">
            Mở từ{' '}
            <Link to={`/projects/${task.projectId}`} className="hover:text-foreground underline-offset-2 hover:underline">
              bảng {task.project.name}
            </Link>
          </p>
        </aside>
      </div>
    </PageContainer>
  )
}

function DetailSkeleton() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-4" aria-busy="true" aria-label="Đang tải công việc">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-10 w-72" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Skeleton className="h-44 rounded-[10px]" />
          <Skeleton className="h-64 rounded-[10px]" />
          <Skeleton className="h-52 rounded-[10px]" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-96 rounded-[10px]" />
          <Skeleton className="h-40 rounded-[10px]" />
        </div>
      </div>
    </PageContainer>
  )
}
