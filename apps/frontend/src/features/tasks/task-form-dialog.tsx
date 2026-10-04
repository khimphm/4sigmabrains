import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [, setParams] = useSearchParams()
  const empty = () => ({
    projectId: projectId ?? '',
    title: '',
    description: '',
    status: status ?? ('TODO' as TaskStatus),
    priority: 'MEDIUM' as TaskPriority,
    assigneeId: assigneeId ?? null,
    dueDate: dueDate ?? '',
    checklist: '',
  })
  const [form, setForm] = useState(empty)
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi mở hộp thoại
  useEffect(() => {
    if (open) setForm(empty())
  }, [open])
  const set = <K extends keyof ReturnType<typeof empty>>(k: K, v: ReturnType<typeof empty>[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.projectId) return toast.error('Chọn dự án')
    create.mutate(
      {
        ...form,
        description: form.description || undefined,
        dueDate: fromLocalInput(form.dueDate),
        checklist: form.checklist.split('\n').map((s) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: (task) => {
          toast.success(`Đã tạo ${task.project.key}-${task.number}`, {
            action: { label: 'Mở', onClick: () => setParams((p) => (p.set('task', task.id), p)) },
          })
          onOpenChange(false)
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Công việc mới</DialogTitle>
            <DialogDescription>Giao việc, đặt hạn chót và hệ thống sẽ tự nhắc.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Tên công việc, vd: Kiểm tra bản vẽ kết cấu tầng 3"
            className="h-11 text-base"
          />
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Mô tả (không bắt buộc)" rows={3} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Dự án">
              <Select value={form.projectId} onValueChange={(v) => set('projectId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Người làm">
              <UserSelect className="w-full" value={form.assigneeId} onChange={(v) => set('assigneeId', v)} />
            </FormField>
            <FormField label="Trạng thái">
              <Select value={form.status} onValueChange={(v) => set('status', v as TaskStatus)}>
                <SelectTrigger className="w-full">
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
            <FormField label="Độ ưu tiên">
              <Select value={form.priority} onValueChange={(v) => set('priority', v as TaskPriority)}>
                <SelectTrigger className="w-full">
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
            <FormField label="Hạn chót">
              <Input type="datetime-local" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Checklist (mỗi dòng một mục)">
            <Textarea value={form.checklist} onChange={(e) => set('checklist', e.target.value)} rows={2} placeholder={'Kiểm tra tầng 1\nKiểm tra tầng 2'} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Tạo công việc
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  )
}
