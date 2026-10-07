import { Check, ChevronsUpDown, Copy, Link2, Loader2, MailCheck, X } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/user-avatar'
import { useClients, useSaveClient, type ClientInput } from '@/features/clients/api'
import { useProjects } from '@/features/projects/api'
import { useInviteMember, useUpdateMember } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { ROLE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Client, User, UserRole } from '@/types/api'

export const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'MEMBER', 'CLIENT']

export const ROLE_HINT: Record<UserRole, string> = {
  ADMIN: 'Toàn quyền: duyệt thành viên, cài đặt hệ thống',
  MANAGER: 'Tạo dự án, giao việc, chốt quyết định',
  MEMBER: 'Làm việc trong các dự án được thêm vào',
  CLIENT: 'Chỉ xem tiến độ dự án qua cổng khách hàng',
}

const ROLE_CLASS: Record<UserRole, string> = {
  ADMIN: 'bg-primary-soft text-primary',
  MANAGER: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  MEMBER: 'bg-neutral text-neutral-foreground',
  CLIENT: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
}

export function RolePill({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-semibold whitespace-nowrap',
        ROLE_CLASS[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}

export function Field({ label, htmlFor, hint, children, className }: {
  label: string
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function RoleSelect({ value, onChange, id, disabled }: { value: UserRole; onChange: (r: UserRole) => void; id?: string; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as UserRole)} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            <span className="flex flex-col items-start">
              <span>{ROLE_LABEL[r]}</span>
              <span className="text-muted-foreground text-xs">{ROLE_HINT[r]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ClientSelect({ value, onChange, id }: { value: string | null; onChange: (id: string) => void; id?: string }) {
  const { data: clients = [] } = useClients()
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={clients.length ? 'Chọn khách hàng / chủ đầu tư' : 'Chưa có khách hàng nào'} />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// --- Sửa vai trò & thông tin thành viên (admin) ---
export function MemberEditDialog({ user, open, onOpenChange, isSelf }: {
  user: User | null
  open: boolean
  onOpenChange: (o: boolean) => void
  isSelf?: boolean
}) {
  const update = useUpdateMember()
  const [role, setRole] = useState<UserRole>('MEMBER')
  const [clientId, setClientId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    if (open && user) {
      setRole(user.role)
      setClientId(user.clientId)
      setTitle(user.title ?? '')
      setDepartment(user.department ?? '')
    }
  }, [open, user])

  if (!user) return null
  const needClient = role === 'CLIENT' && !clientId
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (needClient) return
    update.mutate(
      {
        id: user.id,
        ...(isSelf || role === user.role ? {} : { role }),
        ...(role === 'CLIENT' ? { clientId } : {}),
        title: title.trim(),
        department: department.trim(),
      },
      {
        onSuccess: () => {
          toast.success(`Đã cập nhật ${user.name}`)
          onOpenChange(false)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thành viên</DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-1">
              <UserAvatar user={user} className="size-6" />
              <span className="truncate">
                {user.name} · {user.email}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Field label="Vai trò" htmlFor="edit-role" hint={isSelf ? 'Bạn không thể tự đổi vai trò của chính mình.' : undefined}>
            <RoleSelect id="edit-role" value={role} onChange={setRole} disabled={isSelf} />
          </Field>
          {role === 'CLIENT' && (
            <Field label="Thuộc khách hàng" htmlFor="edit-client" hint={needClient ? 'Tài khoản khách hàng cần chọn khách hàng.' : undefined}>
              <ClientSelect id="edit-client" value={clientId} onChange={setClientId} />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Chức danh" htmlFor="edit-title">
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kỹ sư kết cấu" maxLength={100} />
            </Field>
            <Field label="Phòng ban" htmlFor="edit-dept">
              <Input id="edit-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Thiết kế" maxLength={100} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={update.isPending || needClient}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Ô sao chép link ---
export function CopyBox({ value, label = 'Link mời' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Đã sao chép link')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Không sao chép được, hãy chọn và sao chép thủ công')
    }
  }
  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] font-semibold">{label}</span>
      <div className="bg-subtle flex items-center gap-2 rounded-md border p-1.5 pl-3">
        <Link2 className="text-muted-foreground size-4 shrink-0" strokeWidth={1.8} aria-hidden />
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
        />
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Đã chép' : 'Sao chép'}
        </Button>
      </div>
    </div>
  )
}

// --- Chọn nhiều dự án ---
function ProjectMultiSelect({ value, onChange, id }: { value: string[]; onChange: (ids: string[]) => void; id?: string }) {
  const { data: projects = [] } = useProjects()
  const [open, setOpen] = useState(false)
  const selected = projects.filter((p) => value.includes(p.id))
  const toggle = (pid: string) => onChange(value.includes(pid) ? value.filter((v) => v !== pid) : [...value, pid])
  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" className="w-full justify-between font-normal">
            <span className={cn('truncate', !value.length && 'text-muted-foreground')}>
              {value.length ? `Đã chọn ${value.length} dự án` : 'Chọn dự án (không bắt buộc)'}
            </span>
            <ChevronsUpDown className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm dự án…" />
            <CommandList>
              <CommandEmpty>Không tìm thấy dự án</CommandEmpty>
              <CommandGroup>
                {projects
                  .filter((p) => p.status !== 'ARCHIVED')
                  .map((p) => (
                    <CommandItem key={p.id} value={`${p.key} ${p.name}`} onSelect={() => toggle(p.id)}>
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="truncate">{p.name}</span>
                      <span className="text-muted-foreground ml-auto font-mono text-xs">{p.key}</span>
                      <Check className={cn('size-4', value.includes(p.id) ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span key={p.id} className="bg-subtle inline-flex h-6 items-center gap-1.5 rounded-md border pr-1 pl-2 text-xs font-medium">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.name}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                aria-label={`Bỏ ${p.name}`}
                className="hover:bg-muted text-muted-foreground hover:text-foreground grid size-4 cursor-pointer place-items-center rounded transition-colors"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Mời thành viên / tài khoản khách hàng ---
export function InviteDialog({ open, onOpenChange, presetRole, presetClientId }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  presetRole?: UserRole
  presetClientId?: string
}) {
  const invite = useInviteMember()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [role, setRole] = useState<UserRole>(presetRole ?? 'MEMBER')
  const [clientId, setClientId] = useState<string | null>(presetClientId ?? null)
  const [projectIds, setProjectIds] = useState<string[]>([])
  const [result, setResult] = useState<{ name: string; email: string; link: string | null } | null>(null)

  useEffect(() => {
    if (open) {
      setEmail('')
      setName('')
      setTitle('')
      setRole(presetRole ?? 'MEMBER')
      setClientId(presetClientId ?? null)
      setProjectIds([])
      setResult(null)
      invite.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetRole, presetClientId])

  const isClient = role === 'CLIENT'
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (isClient && !clientId) {
      toast.error('Mời khách hàng cần chọn khách hàng')
      return
    }
    invite.mutate(
      {
        email: email.trim(),
        name: name.trim(),
        role,
        clientId: isClient ? clientId : null,
        title: title.trim() || undefined,
        projectIds: projectIds.length ? projectIds : undefined,
      },
      {
        onSuccess: (r) => {
          setResult({ name: r.user.name, email: r.user.email, link: r.inviteLink })
          if (!r.inviteLink) toast.success(`Đã gửi lời mời tới ${r.user.email}`)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-lg">
        {result ? (
          <div className="grid gap-5">
            <DialogHeader>
              <span className="bg-on-time text-on-time-foreground mb-1 grid size-10 place-items-center rounded-lg">
                <MailCheck className="size-5" strokeWidth={1.8} />
              </span>
              <DialogTitle>Đã tạo tài khoản cho {result.name}</DialogTitle>
              <DialogDescription>
                {result.link
                  ? 'Máy chủ chưa cấu hình gửi email (SMTP). Hãy gửi link dưới đây cho người được mời — link đặt mật khẩu có hiệu lực 7 ngày.'
                  : `Email mời đã được gửi tới ${result.email}. Link đặt mật khẩu có hiệu lực 7 ngày.`}
              </DialogDescription>
            </DialogHeader>
            {result.link && <CopyBox value={result.link} />}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResult(null)}>
                Mời thêm người
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Xong
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{presetRole === 'CLIENT' ? 'Mời tài khoản khách hàng' : 'Mời thành viên'}</DialogTitle>
              <DialogDescription>
                {isClient
                  ? 'Khách hàng chỉ xem được tiến độ và file được chia sẻ của dự án thuộc công ty mình.'
                  : 'Tài khoản được kích hoạt ngay; người được mời đặt mật khẩu qua link hoặc đăng nhập bằng Google.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ và tên" htmlFor="inv-name">
                <Input id="inv-name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" autoFocus />
              </Field>
              <Field label="Email" htmlFor="inv-email">
                <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@congty.vn" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vai trò" htmlFor="inv-role">
                <RoleSelect id="inv-role" value={role} onChange={setRole} disabled={presetRole === 'CLIENT'} />
              </Field>
              {isClient ? (
                <Field label="Thuộc khách hàng" htmlFor="inv-client">
                  <ClientSelect id="inv-client" value={clientId} onChange={setClientId} />
                </Field>
              ) : (
                <Field label="Chức danh" htmlFor="inv-title">
                  <Input id="inv-title" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kỹ sư dữ liệu" />
                </Field>
              )}
            </div>
            {!isClient && (
              <Field label="Thêm vào dự án" htmlFor="inv-projects" hint="Người được mời sẽ thấy ngay các dự án này.">
                <ProjectMultiSelect id="inv-projects" value={projectIds} onChange={setProjectIds} />
              </Field>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending && <Loader2 className="animate-spin" />}
                Gửi lời mời
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- Thêm / sửa khách hàng ---
export function ClientFormDialog({ client, open, onOpenChange, onSaved }: {
  client?: Client | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved?: (id: string) => void
}) {
  const save = useSaveClient()
  const empty: ClientInput = { name: '', contactName: '', email: '', phone: '', address: '', notes: '' }
  const [form, setForm] = useState<ClientInput>(empty)
  useEffect(() => {
    if (open)
      setForm(
        client
          ? {
              name: client.name,
              contactName: client.contactName ?? '',
              email: client.email ?? '',
              phone: client.phone ?? '',
              address: client.address ?? '',
              notes: client.notes ?? '',
            }
          : empty,
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  const set = (k: keyof ClientInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Khi sửa: chuỗi rỗng → null để xoá; khi tạo: bỏ trường trống
    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]).filter(([, v]) => client || v),
    ) as ClientInput
    if (client) for (const k of Object.keys(clean) as (keyof ClientInput)[]) if (clean[k] === '' && k !== 'name') clean[k] = null
    save.mutate(
      { ...clean, id: client?.id },
      {
        onSuccess: (c) => {
          toast.success(client ? 'Đã cập nhật khách hàng' : `Đã thêm ${c.name}`)
          onOpenChange(false)
          onSaved?.(c.id)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{client ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng'}</DialogTitle>
            <DialogDescription>Chủ đầu tư hoặc đơn vị đặt hàng; gắn với dự án và tài khoản cổng khách hàng.</DialogDescription>
          </DialogHeader>
          <Field label="Tên khách hàng" htmlFor="cl-name">
            <Input id="cl-name" required minLength={2} maxLength={200} value={form.name} onChange={set('name')} placeholder="Công ty CP Đầu tư Minh Phát" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Người liên hệ" htmlFor="cl-contact">
              <Input id="cl-contact" maxLength={100} value={form.contactName ?? ''} onChange={set('contactName')} placeholder="Anh Trần Minh" />
            </Field>
            <Field label="Số điện thoại" htmlFor="cl-phone">
              <Input id="cl-phone" type="tel" maxLength={30} value={form.phone ?? ''} onChange={set('phone')} placeholder="0903 123 456" />
            </Field>
          </div>
          <Field label="Email" htmlFor="cl-email">
            <Input id="cl-email" type="email" value={form.email ?? ''} onChange={set('email')} placeholder="lienhe@minhphat.vn" />
          </Field>
          <Field label="Địa chỉ" htmlFor="cl-address">
            <Input id="cl-address" maxLength={300} value={form.address ?? ''} onChange={set('address')} placeholder="Số nhà, đường, quận, thành phố" />
          </Field>
          <Field label="Ghi chú" htmlFor="cl-notes">
            <Textarea id="cl-notes" rows={3} maxLength={5000} value={form.notes ?? ''} onChange={set('notes')} placeholder="Yêu cầu riêng, đầu mối thanh toán…" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {client ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
