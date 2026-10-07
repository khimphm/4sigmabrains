import { Check, Loader2, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/user-avatar'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { PROJECT_COLORS, PROJECT_STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types/api'
import { useClientOptions, useSaveProject } from './api'

// Màu dự án từ Figma đứng đầu, sau đó là bảng màu mở rộng
export const PROJECT_PALETTE = [...new Set(['#4F7CF5', '#E08A3C', '#38B2A0', ...PROJECT_COLORS])]

const NO_CLIENT = '__none__'

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

function Field({ label, htmlFor, hint, children, className }: {
  label: string
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

export function ProjectFormDialog({ open, onOpenChange, project }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  project?: Project
}) {
  const navigate = useNavigate()
  const uid = useId()
  const save = useSaveProject(project?.id)
  const { data: users = [] } = useUsers()
  const { data: clients = [] } = useClientOptions()
  const init = () => ({
    name: project?.name ?? '',
    key: project?.key ?? '',
    description: project?.description ?? '',
    color: project?.color ?? PROJECT_PALETTE[0],
    status: project?.status ?? ('ACTIVE' as ProjectStatus),
    startDate: project?.startDate?.slice(0, 10) ?? '',
    dueDate: project?.dueDate?.slice(0, 10) ?? '',
    clientId: project?.clientId ?? null,
    memberIds: [] as string[],
  })
  const [form, setForm] = useState(init)
  const [keyTouched, setKeyTouched] = useState(false)
  const [memberQ, setMemberQ] = useState('')
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- chỉ khởi tạo lại khi mở hộp thoại
  useEffect(() => {
    if (open) {
      setForm(init())
      setKeyTouched(!!project)
      setMemberQ('')
    }
  }, [open])

  const staff = useMemo(
    () =>
      users.filter(
        (u) => u.role !== 'CLIENT' && (!memberQ || u.name.toLowerCase().includes(memberQ.toLowerCase())),
      ),
    [users, memberQ],
  )
  const dateError = form.startDate && form.dueDate && form.dueDate < form.startDate
  const palette = form.color && !PROJECT_PALETTE.includes(form.color) ? [...PROJECT_PALETTE, form.color] : PROJECT_PALETTE

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (dateError) return toast.error('Hạn hoàn thành phải sau ngày bắt đầu')
    const { key, memberIds, status, ...rest } = form
    const data = {
      ...rest,
      description: rest.description || undefined,
      startDate: rest.startDate || null,
      dueDate: rest.dueDate || null,
      ...(project ? { status } : { key, memberIds, clientId: rest.clientId || undefined }),
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
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-md text-xs font-bold text-white transition-colors"
                style={{ background: form.color }}
                aria-hidden
              >
                {(form.key || 'DA').slice(0, 3)}
              </span>
              {project ? 'Sửa dự án' : 'Tạo dự án'}
            </DialogTitle>
            <DialogDescription>Mỗi dự án có bảng Kanban, danh sách, lịch, tệp và thảo luận riêng.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
            <Field label="Tên dự án" htmlFor={`${uid}-name`}>
              <Input
                id={`${uid}-name`}
                autoFocus
                required
                minLength={2}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value, key: keyTouched ? f.key : suggestKey(e.target.value) }))
                }
                placeholder="vd: Chung cư Tân An"
              />
            </Field>
            <Field label="Mã dự án" htmlFor={`${uid}-key`} hint={project ? 'Không đổi được sau khi tạo' : `Việc sẽ đánh số ${form.key || 'TA'}-1, ${form.key || 'TA'}-2…`}>
              <Input
                id={`${uid}-key`}
                required
                disabled={!!project}
                value={form.key}
                minLength={2}
                maxLength={10}
                pattern="[A-Z][A-Z0-9]{1,9}"
                title="2–10 chữ in hoa hoặc số, bắt đầu bằng chữ"
                onChange={(e) => {
                  setKeyTouched(true)
                  setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))
                }}
                placeholder="TA"
                className="font-mono tracking-wide"
              />
            </Field>
          </div>

          <Field label="Mô tả" htmlFor={`${uid}-desc`}>
            <Textarea
              id={`${uid}-desc`}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Phạm vi, mục tiêu và các mốc chính của dự án"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Khách hàng" htmlFor={`${uid}-client`}>
              <Select
                value={form.clientId ?? NO_CLIENT}
                onValueChange={(v) => setForm((f) => ({ ...f, clientId: v === NO_CLIENT ? null : v }))}
              >
                <SelectTrigger id={`${uid}-client`} className="w-full">
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLIENT}>Dự án nội bộ (không có khách hàng)</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {project ? (
              <Field label="Trạng thái" htmlFor={`${uid}-status`}>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}>
                  <SelectTrigger id={`${uid}-status`} className="w-full">
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
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}
            <Field label="Ngày bắt đầu" htmlFor={`${uid}-start`}>
              <Input
                id={`${uid}-start`}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </Field>
            <Field
              label="Hạn hoàn thành"
              htmlFor={`${uid}-due`}
              hint={dateError ? <span className="text-overdue-foreground font-medium">Hạn phải sau ngày bắt đầu</span> : undefined}
            >
              <Input
                id={`${uid}-due`}
                type="date"
                value={form.dueDate}
                min={form.startDate || undefined}
                aria-invalid={!!dateError}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Màu nhận diện">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Màu dự án">
              {palette.map((c) => {
                const on = form.color.toLowerCase() === c.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      'ring-offset-card grid size-8 cursor-pointer place-items-center rounded-md text-white transition-transform duration-150 outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      on && 'ring-foreground/70 ring-2 ring-offset-2',
                    )}
                    style={{ background: c }}
                    aria-label={`Màu ${c}`}
                  >
                    {on && <Check className="size-4" strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>
          </Field>

          {!project && (
            <Field label={`Thành viên${form.memberIds.length ? ` · đã chọn ${form.memberIds.length}` : ''}`} hint="Bạn sẽ là trưởng dự án. Có thể mời thêm sau.">
              <div className="rounded-md border">
                <div className="relative border-b">
                  <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
                  <input
                    value={memberQ}
                    onChange={(e) => setMemberQ(e.target.value)}
                    placeholder="Tìm người…"
                    aria-label="Tìm thành viên"
                    className="placeholder:text-muted-foreground h-9 w-full bg-transparent pr-3 pl-8 text-sm outline-none"
                  />
                </div>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto p-2">
                  {staff.map((u) => {
                    const on = form.memberIds.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setForm((f) => ({ ...f, memberIds: on ? f.memberIds.filter((i) => i !== u.id) : [...f.memberIds, u.id] }))
                        }
                        className={cn(
                          'flex cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-xs font-medium transition-colors',
                          on ? 'border-primary bg-primary-soft text-primary' : 'hover:bg-subtle',
                        )}
                      >
                        <UserAvatar user={u} className="size-5" />
                        {u.name}
                        {on && <Check className="size-3" />}
                      </button>
                    )
                  })}
                  {!staff.length && <p className="text-muted-foreground px-1 py-2 text-xs">Không tìm thấy ai</p>}
                </div>
              </div>
            </Field>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {project ? 'Lưu thay đổi' : 'Tạo dự án'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
