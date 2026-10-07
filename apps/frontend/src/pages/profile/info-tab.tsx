import { Loader2, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSaveProfile } from '@/features/profile/api'
import { errorMessage } from '@/lib/api'
import { ROLE_LABEL } from '@/lib/constants'
import { fmtDate } from '@/lib/format'
import type { User } from '@/types/api'
import { SectionCard } from './parts'

const SUGGESTED = ['Đọc bản vẽ kết cấu', 'Gán nhãn dữ liệu', 'AutoCAD', 'Revit', 'BIM', 'Dự toán', 'Python', 'Quản lý dự án']

export function InfoTab({ user }: { user: User }) {
  const save = useSaveProfile()
  const initial = {
    name: user.name,
    title: user.title ?? '',
    department: user.department ?? '',
    phone: user.phone ?? '',
    bio: user.bio ?? '',
  }
  const [form, setForm] = useState(initial)
  const [skills, setSkills] = useState<string[]>(user.skills)
  const [draft, setDraft] = useState('')
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || skills.join('|') !== user.skills.join('|')

  const addSkill = (raw: string) => {
    const s = raw.trim().slice(0, 40)
    if (!s) return
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) return setDraft('')
    if (skills.length >= 30) return toast.error('Tối đa 30 kỹ năng')
    setSkills([...skills, s])
    setDraft('')
  }
  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(draft)
    } else if (e.key === 'Backspace' && !draft && skills.length) {
      setSkills(skills.slice(0, -1))
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return toast.error('Họ tên cần ít nhất 2 ký tự')
    const finalSkills = draft.trim() ? [...skills, draft.trim()] : skills
    save.mutate(
      { ...form, name: form.name.trim(), skills: finalSkills },
      { onSuccess: () => toast.success('Đã lưu hồ sơ'), onError: (err) => toast.error(errorMessage(err)) },
    )
  }

  const field = (key: keyof typeof form) => ({
    id: `pf-${key}`,
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  })

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <SectionCard title="Thông tin cá nhân" description="Hiển thị cho đồng nghiệp trong không gian làm việc.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên" htmlFor="pf-name">
              <Input {...field('name')} required minLength={2} maxLength={100} autoComplete="name" />
            </Field>
            <Field label="Số điện thoại" htmlFor="pf-phone">
              <Input {...field('phone')} maxLength={30} inputMode="tel" autoComplete="tel" placeholder="vd: 0912 345 678" />
            </Field>
            <Field label="Email" htmlFor="pf-email" hint="Email đăng nhập, không thể đổi tại đây.">
              <Input id="pf-email" value={user.email} disabled readOnly />
            </Field>
            <Field label="Vai trò" htmlFor="pf-role" hint="Quản trị viên phân quyền.">
              <Input id="pf-role" value={ROLE_LABEL[user.role]} disabled readOnly />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Nghề nghiệp" description="Giúp mọi người biết bạn phụ trách mảng nào.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Chức danh" htmlFor="pf-title">
              <Input {...field('title')} maxLength={100} placeholder="vd: Kỹ sư kết cấu" />
            </Field>
            <Field label="Phòng ban" htmlFor="pf-department">
              <Input {...field('department')} maxLength={100} placeholder="vd: Phòng Kỹ thuật" />
            </Field>
            <Field label="Giới thiệu ngắn" htmlFor="pf-bio" className="sm:col-span-2" hint={`${form.bio.length}/1000`}>
              <Textarea {...field('bio')} maxLength={1000} rows={4} placeholder="Kinh nghiệm, dự án tiêu biểu, lĩnh vực quan tâm…" />
            </Field>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-skill">Kỹ năng và chuyên môn</Label>
              <div className="border-input focus-within:border-ring focus-within:ring-ring/50 bg-card flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 transition-shadow focus-within:ring-[3px] dark:bg-input/30">
                {skills.map((s) => (
                  <span key={s} className="bg-primary-soft text-primary inline-flex h-7 items-center gap-1 rounded-full pr-1 pl-3 text-[13px] font-semibold">
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((x) => x !== s))}
                      className="hover:bg-primary/15 grid size-5 cursor-pointer place-items-center rounded-full transition-colors"
                      aria-label={`Xoá kỹ năng ${s}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
                <input
                  id="pf-skill"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onSkillKey}
                  onBlur={() => addSkill(draft)}
                  maxLength={40}
                  placeholder={skills.length ? 'Thêm…' : 'Nhập kỹ năng rồi nhấn Enter'}
                  className="placeholder:text-muted-foreground h-7 min-w-[140px] flex-1 bg-transparent px-1 text-sm outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-muted-foreground text-xs">Gợi ý:</span>
                {SUGGESTED.filter((s) => !skills.includes(s))
                  .slice(0, 6)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="text-text-secondary hover:border-primary/40 hover:text-primary cursor-pointer rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <aside className="min-w-0 space-y-6">
        <SectionCard title="Tài khoản">
          <dl className="space-y-3 text-sm">
            <Row k="Trạng thái" v={user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status === 'PENDING' ? 'Chờ duyệt' : 'Đã khoá'} />
            <Row k="Tham gia" v={fmtDate(user.createdAt)} />
            <Row k="Cập nhật" v={fmtDate(user.updatedAt)} />
            {user.client && <Row k="Khách hàng" v={user.client.name} />}
          </dl>
        </SectionCard>
        <div className="bg-card shadow-card sticky top-20 flex flex-col gap-2 rounded-[10px] border p-4">
          <Button type="submit" disabled={!dirty || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Lưu thay đổi
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!dirty || save.isPending}
            onClick={() => {
              setForm(initial)
              setSkills(user.skills)
              setDraft('')
            }}
          >
            Huỷ thay đổi
          </Button>
          <p className="text-muted-foreground text-center text-xs">{dirty ? 'Có thay đổi chưa lưu' : 'Mọi thay đổi đã được lưu'}</p>
        </div>
      </aside>
    </form>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-secondary">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}
