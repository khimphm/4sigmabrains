import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PriorityIcon, StatusDot } from '@/components/task-meta'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserSelect } from '@/components/user-select'
import { useProjects } from '@/features/projects/api'
import { errorMessage } from '@/lib/api'
import { PRIORITIES, PRIORITY_META, STATUS_META, TASK_STATUSES } from '@/lib/constants'
import { fromLocalInput } from '@/lib/format'
import type { TaskPriority, TaskStatus } from '@/types/api'
import { useCreateTask } from './api'
import { LabelPicker } from './task-detail/label-picker'

export function TaskFormDialog({ open, onOpenChange, projectId, status, assigneeId, dueDate }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  projectId?: string
  status?: TaskStatus
  assigneeId?: string | null
  dueDate?: string
}) {
  const { data: projects = [] } = useProjects()
  const create = useCreateTask()
  const navigate = useNavigate()
  const empty = () => ({
    projectId: projectId ?? '',
    title: '',
    description: '',
    acceptanceCriteria: '',
    status: status ?? ('TODO' as TaskStatus),
    priority: 'MEDIUM' as TaskPriority,
    assigneeId: assigneeId ?? null,
    startDate: '',
    dueDate: dueDate ?? '',
    labels: [] as string[],
    checklist: '',
  })
  const [form, setForm] = useState(empty)
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi mở hộp thoại
  useEffect(() => {
    if (open) setForm(empty())
  }, [open])
  type Form = ReturnType<typeof empty>
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  const lockedProject = !!projectId
  const project = projects.find((p) => p.id === form.projectId)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Nhập tên công việc')
    if (!form.projectId) return toast.error('Chọn dự án')
    if (form.startDate && form.dueDate && new Date(form.startDate) > new Date(form.dueDate))
      return toast.error('Ngày bắt đầu phải trước hạn hoàn thành')
    create.mutate(
      {
        projectId: form.projectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        acceptanceCriteria: form.acceptanceCriteria.trim() || undefined,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId ?? undefined,
        labels: form.labels,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        dueDate: fromLocalInput(form.dueDate) ?? undefined,
        checklist: form.checklist.split('\n').map((s) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: (task) => {
          toast.success(`Đã tạo ${task.project?.key ?? project?.key ?? ''}-${task.number}`, {
            description: task.title,
            action: { label: 'Mở', onClick: () => navigate(`/tasks/${task.id}`) },
          })
          onOpenChange(false)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  const checklistCount = form.checklist.split('\n').filter((s) => s.trim()).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold">Công việc mới</DialogTitle>
            <DialogDescription>
              {lockedProject && project ? `Trong dự án ${project.name}. ` : ''}Giao việc, đặt hạn chót và hệ thống sẽ tự nhắc trước
              24 giờ và 2 giờ.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Tên công việc" htmlFor="task-title">
            <Input
              id="task-title"
              autoFocus
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Vd: Gán nhãn lỗi bộ bản vẽ đợt 1"
              className="h-11 text-base font-medium"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Mô tả" htmlFor="task-desc">
              <Textarea
                id="task-desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Cần làm gì, phạm vi, lưu ý…"
                rows={3}
              />
            </FormField>
            <FormField label="Tiêu chí hoàn thành" htmlFor="task-ac">
              <Textarea
                id="task-ac"
                value={form.acceptanceCriteria}
                onChange={(e) => set('acceptanceCriteria', e.target.value)}
                placeholder="Thế nào là xong? Vd: Đủ 20 bản vẽ có nhãn, trưởng nhóm duyệt"
                rows={3}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {!lockedProject && (
              <FormField label="Dự án">
                <Select value={form.projectId} onValueChange={(v) => set('projectId', v)}>
                  <SelectTrigger className="w-full" aria-label="Dự án">
                    <SelectValue placeholder="Chọn dự án" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                        {p.name}
                        <span className="text-muted-foreground font-mono text-xs">{p.key}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
            <FormField label="Người phụ trách">
              <UserSelect className="w-full" value={form.assigneeId} onChange={(v) => set('assigneeId', v)} />
            </FormField>
            <FormField label="Trạng thái">
              <Select value={form.status} onValueChange={(v) => set('status', v as TaskStatus)}>
                <SelectTrigger className="w-full" aria-label="Trạng thái">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <StatusDot status={s} />
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Mức ưu tiên">
              <Select value={form.priority} onValueChange={(v) => set('priority', v as TaskPriority)}>
                <SelectTrigger className="w-full" aria-label="Mức ưu tiên">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <PriorityIcon priority={p} />
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Bắt đầu" htmlFor="task-start">
              <Input id="task-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="Hạn hoàn thành" htmlFor="task-due">
              <Input
                id="task-due"
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Nhãn">
            <LabelPicker value={form.labels} onChange={(l) => set('labels', l)} />
          </FormField>

          <FormField
            label={`Checklist${checklistCount ? ` · ${checklistCount} mục` : ''} (mỗi dòng một mục)`}
            htmlFor="task-checklist"
          >
            <Textarea
              id="task-checklist"
              value={form.checklist}
              onChange={(e) => set('checklist', e.target.value)}
              rows={3}
              placeholder={'Tải 20 bản vẽ đợt 1 lên hệ thống\nGán nhãn lỗi khung tên\nGửi trưởng nhóm duyệt chéo'}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />}
              Tạo công việc
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FormField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-text-secondary text-[13px] font-semibold">
        {label}
      </Label>
      {children}
    </div>
  )
}
