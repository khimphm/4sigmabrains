import { Check, Lock, MoreHorizontal, Unlock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/user-avatar'
import { useAuth } from '@/features/auth/use-auth'
import { useUpdateMember, useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { ROLE_LABEL, USER_STATUS_LABEL } from '@/lib/constants'
import { fmtDate, fromNow } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types/api'

const STATUS_STYLE: Record<UserStatus, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  DISABLED: 'bg-slate-500/10 text-slate-500',
}

export function AdminMembersPage() {
  const { user: me } = useAuth()
  const { data: users = [] } = useUsers(true)
  const update = useUpdateMember()
  const [filter, setFilter] = useState<UserStatus | 'ALL'>('ALL')
  const pending = users.filter((u) => u.status === 'PENDING')
  const shown = users.filter((u) => filter === 'ALL' || u.status === filter)
  const act = (id: string, data: { role?: UserRole; status?: UserStatus }, msg: string) =>
    update.mutate({ id, ...data }, { onSuccess: () => toast.success(msg), onError: (e) => toast.error(errorMessage(e)) })

  return (
    <PageContainer>
      <PageHeader title="Quản trị thành viên" description={`${users.length} tài khoản · ${pending.length} đang chờ duyệt`}>
        <div className="flex gap-1">
          {(['ALL', 'PENDING', 'ACTIVE', 'DISABLED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn('rounded-full px-3 py-1 text-sm transition-colors', filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}
            >
              {f === 'ALL' ? 'Tất cả' : USER_STATUS_LABEL[f]}
              <span className="ml-1.5 opacity-60">{f === 'ALL' ? users.length : users.filter((u) => u.status === f).length}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {pending.length > 0 && filter !== 'ACTIVE' && filter !== 'DISABLED' && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-amber-700 dark:text-amber-400">Chờ duyệt</h2>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <UserAvatar user={u} className="size-9" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {u.email} · đăng nhập {fromNow(u.createdAt)}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => act(u.id, { status: 'DISABLED' }, 'Đã từ chối')}>
                  Từ chối
                </Button>
                <Button size="sm" onClick={() => act(u.id, { status: 'ACTIVE' }, `Đã duyệt ${u.name}`)}>
                  <Check /> Duyệt
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="text-muted-foreground hidden grid-cols-[1fr_140px_140px_140px_48px] gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid">
          <span>Thành viên</span>
          <span>Vai trò</span>
          <span>Trạng thái</span>
          <span>Đăng nhập gần nhất</span>
          <span />
        </div>
        {shown.map((u) => (
          <div key={u.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-3 last:border-0 md:grid-cols-[1fr_140px_140px_140px_48px]">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar user={u} className="size-9" />
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {u.name} {u.id === me?.id && <span className="text-muted-foreground text-xs">(bạn)</span>}
                </div>
                <div className="text-muted-foreground truncate text-xs">{u.email}</div>
              </div>
            </div>
            <span className="hidden text-sm md:block">{ROLE_LABEL[u.role]}</span>
            <span className="hidden md:block">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[u.status])}>{USER_STATUS_LABEL[u.status]}</span>
            </span>
            <span className="text-muted-foreground hidden text-xs md:block">{u.lastLoginAt ? fmtDate(u.lastLoginAt, 'HH:mm dd/MM') : '—'}</span>
            {u.id !== me?.id ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Tuỳ chọn">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Vai trò</DropdownMenuLabel>
                  {(['ADMIN', 'MANAGER', 'MEMBER'] as const).map((r) => (
                    <DropdownMenuItem key={r} onClick={() => act(u.id, { role: r }, `Đã đổi vai trò thành ${ROLE_LABEL[r]}`)}>
                      {ROLE_LABEL[r]}
                      {u.role === r && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {u.status === 'ACTIVE' ? (
                    <DropdownMenuItem variant="destructive" onClick={() => act(u.id, { status: 'DISABLED' }, 'Đã khoá tài khoản')}>
                      <Lock /> Khoá tài khoản
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => act(u.id, { status: 'ACTIVE' }, 'Đã kích hoạt tài khoản')}>
                      <Unlock /> Kích hoạt
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        Quản trị: toàn quyền, duyệt thành viên. Quản lý: tạo và sửa mọi dự án, chốt quyết định. Thành viên: làm việc trong dự án, tạo việc, thảo luận, bình chọn.
      </p>
    </PageContainer>
  )
}
