import { Check } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/user-avatar'
import { FormField } from '@/features/tasks/task-form-dialog'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { PROJECT_COLORS, PROJECT_STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/api'
import { useSaveProject } from './api'

// Gợi ý mã dự án từ tên: "Tân An Tower" -> "TAT"
const suggestKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'D')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)

export function ProjectFormDialog({ open, onOpenChange, project }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  project?: Project
}) {
  const navigate = useNavigate()
  const save = useSaveProject(project?.id)
  const { data: users = [] } = useUsers()
  const init = () => ({
    name: project?.name ?? '',
    key: project?.key ?? '',
    description: project?.description ?? '',
    color: project?.color ?? PROJECT_COLORS[0],
    status: project?.status ?? ('ACTIVE' as ProjectStatus),
    startDate: project?.startDate ?? '',
    dueDate: project?.dueDate ?? '',
    memberIds: [] as string[],
  })
  const [form, setForm] = useState(init)
  const [keyTouched, setKeyTouched] = useState(false)
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi mở hộp thoại
  useEffect(() => {
    if (open) {
      setForm(init())
      setKeyTouched(!!project)
    }
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const { key, memberIds, ...rest } = form
    const data = {
      ...rest,
      startDate: rest.startDate || null,
      dueDate: rest.dueDate || null,
      ...(project ? {} : { key, memberIds }),
    }
    save.mutate(data, {
      onSuccess: (p) => {
        toast.success(project ? 'Đã lưu dự án' : `Đã tạo dự án ${p.name}`)
        onOpenChange(false)
        if (!project) navigate(`/projects/${p.id}`)
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{project ? 'Sửa dự án' : 'Dự án mới'}</DialogTitle>
            <DialogDescription>Mỗi dự án có bảng Kanban, danh sách, lịch và thảo luận riêng.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <FormField label="Tên dự án">
              <Input
                autoFocus
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value, key: keyTouched ? f.key : suggestKey(e.target.value) }))
                }
                placeholder="vd: Chung cư Tân An"
              />
            </FormField>
            <FormField label="Mã (dùng đánh số việc)">
              <Input
                required
                disabled={!!project}
                value={form.key}
                maxLength={10}
                onChange={(e) => {
                  setKeyTouched(true)
                  setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))
                }}
                placeholder="TA"
                className="font-mono"
              />
            </FormField>
          </div>
          <FormField label="Mô tả">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Bắt đầu">
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label="Hạn hoàn thành">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
            {project && (
              <FormField label="Trạng thái">
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_META).map(([k, m]) => (
                      <SelectItem key={k} value={k}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          </div>
          <FormField label="Màu">
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="grid size-7 place-items-center rounded-md text-white transition-transform hover:scale-110"
                  style={{ background: c }}
                  aria-label={`Màu ${c}`}
                >
                  {form.color === c && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </FormField>
          {!project && (
            <FormField label="Thành viên">
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {users.map((u) => {
                  const on = form.memberIds.includes(u.id)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, memberIds: on ? f.memberIds.filter((i) => i !== u.id) : [...f.memberIds, u.id] }))
                      }
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-xs transition-colors',
                        on ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted',
                      )}
                    >
                      <UserAvatar user={u} className="size-5" />
                      {u.name}
                    </button>
                  )
                })}
              </div>
            </FormField>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {project ? 'Lưu' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
