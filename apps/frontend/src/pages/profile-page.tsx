import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { FormField } from '@/features/tasks/task-form-dialog'
import { useUpdateProfile } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { ROLE_LABEL } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import type { User } from '@/types/api'

export function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfileForm key={user.updatedAt} user={user} />
}

function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [form, setForm] = useState({
    name: user.name,
    title: user.title ?? '',
    department: user.department ?? '',
    phone: user.phone ?? '',
    bio: user.bio ?? '',
    emailNotifications: user.emailNotifications,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    update.mutate(form, { onSuccess: () => toast.success('Đã lưu hồ sơ'), onError: (err) => toast.error(errorMessage(err)) })
  }

  return (
    <PageContainer>
      <PageHeader title="Hồ sơ cá nhân" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="bg-card h-fit rounded-xl border p-6 text-center">
          <UserAvatar user={user} className="mx-auto size-24 text-2xl" />
          <h2 className="mt-4 text-lg font-semibold">{user.name}</h2>
          <p className="text-muted-foreground text-sm">{user.title || 'Chưa có chức danh'}</p>
          <span className="bg-primary/10 text-primary mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">{ROLE_LABEL[user.role]}</span>
          <div className="text-muted-foreground mt-5 space-y-1 border-t pt-4 text-left text-xs">
            <div>Email: {user.email}</div>
            <div>Tham gia: {fmtDate(user.createdAt)}</div>
          </div>
        </div>
        <form onSubmit={submit} className="bg-card space-y-4 rounded-xl border p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Họ tên">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="Chức danh">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="vd: Kỹ sư kết cấu" />
            </FormField>
            <FormField label="Phòng ban / nhóm">
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="vd: AI, Thiết kế" />
            </FormField>
            <FormField label="Số điện thoại">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Giới thiệu">
            <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Chuyên môn, mảng phụ trách…" />
          </FormField>
          <label className="flex items-center justify-between rounded-lg border p-4">
            <span>
              <span className="block text-sm font-medium">Nhận thông báo qua email</span>
              <span className="text-muted-foreground text-xs">Giao việc, nhắc deadline, được nhắc tên… vẫn luôn có trong app</span>
            </span>
            <Switch checked={form.emailNotifications} onCheckedChange={(v) => setForm({ ...form, emailNotifications: v })} />
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
