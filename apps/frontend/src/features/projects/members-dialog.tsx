import { Check, Crown, Loader2, Search, UserMinus, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserAvatar } from '@/components/user-avatar'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import { ROLE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Project, ProjectMember, ProjectRole } from '@/types/api'
import { useProjectMembers } from './api'
import { PROJECT_ROLE_LABEL } from './project-utils'

export function MembersDialog({ project, open, onOpenChange, canEdit }: {
  project: Project
  open: boolean
  onOpenChange: (o: boolean) => void
  canEdit: boolean
}) {
  const { data: users = [] } = useUsers()
  const { add, setRole, remove } = useProjectMembers(project.id)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [role, setNewRole] = useState<ProjectRole>('MEMBER')
  const [removing, setRemoving] = useState<ProjectMember | null>(null)
  useEffect(() => {
    if (open) {
      setQ('')
      setPicked([])
      setNewRole('MEMBER')
    }
  }, [open])

  const memberIds = new Set(project.members.map((m) => m.userId))
  const others = useMemo(
    () =>
      users.filter(
        (u) =>
          !memberIds.has(u.id) &&
          u.status === 'ACTIVE' &&
          (!q || `${u.name} ${u.email} ${u.title ?? ''}`.toLowerCase().includes(q.toLowerCase())),
      ),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- memberIds suy ra từ project.members
    [users, project.members, q],
  )
  const members = [...project.members].sort((a, b) => (a.role === b.role ? a.user.name.localeCompare(b.user.name, 'vi') : a.role === 'LEAD' ? -1 : 1))
  const onError = (e: unknown) => toast.error(errorMessage(e))

  const invite = () =>
    add.mutate(
      { userIds: picked, role },
      {
        onSuccess: () => {
          toast.success(`Đã thêm ${picked.length} người vào dự án`)
          setPicked([])
        },
        onError,
      },
    )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Thành viên dự án</DialogTitle>
            <DialogDescription>
              {project.members.length} người đang tham gia {project.name}
            </DialogDescription>
          </DialogHeader>

          <ul className="-mx-2 max-h-72 space-y-0.5 overflow-y-auto">
            {members.map((m) => (
              <li key={m.userId} className="hover:bg-subtle flex items-center gap-3 rounded-md px-2 py-2 transition-colors">
                <UserAvatar user={m.user} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {m.user.name}
                    {m.userId === project.ownerId && <span className="text-muted-foreground text-xs font-normal">· Người tạo</span>}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">{m.user.title || ROLE_LABEL[m.user.role]}</div>
                </div>
                {canEdit ? (
                  <>
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        setRole.mutate(
                          { userId: m.userId, role: v as ProjectRole },
                          { onSuccess: () => toast.success(`${m.user.name}: ${PROJECT_ROLE_LABEL[v as ProjectRole]}`), onError },
                        )
                      }
                    >
                      <SelectTrigger size="sm" className="h-8 w-[140px]" aria-label={`Vai trò của ${m.user.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEAD">Trưởng dự án</SelectItem>
                        <SelectItem value="MEMBER">Thành viên</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-overdue-foreground"
                      onClick={() => setRemoving(m)}
                      aria-label={`Xoá ${m.user.name} khỏi dự án`}
                    >
                      <UserMinus className="size-4" strokeWidth={1.8} />
                    </Button>
                  </>
                ) : (
                  m.role === 'LEAD' && (
                    <span className="bg-due-soon text-due-soon-foreground inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold">
                      <Crown className="size-3.5" /> Trưởng dự án
                    </span>
                  )
                )}
              </li>
            ))}
          </ul>

          {canEdit && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <UserPlus className="text-primary size-4" strokeWidth={1.8} aria-hidden />
                <h4 className="text-sm font-bold">Mời thêm người</h4>
              </div>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên, email…"
                  aria-label="Tìm người để mời"
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring/50 focus-visible:border-ring h-9 w-full rounded-md border bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:ring-[3px]"
                />
              </div>
              <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                {others.map((u) => {
                  const on = picked.includes(u.id)
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPicked((p) => (on ? p.filter((i) => i !== u.id) : [...p, u.id]))}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors',
                          on ? 'bg-primary-soft' : 'hover:bg-subtle',
                        )}
                      >
                        <UserAvatar user={u} className="size-7" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{u.name}</span>
                          <span className="text-muted-foreground block truncate text-xs">{u.title || ROLE_LABEL[u.role]}</span>
                        </span>
                        <span
                          className={cn(
                            'grid size-5 place-items-center rounded border transition-colors',
                            on ? 'bg-primary border-primary text-primary-foreground' : 'border-border-strong',
                          )}
                          aria-hidden
                        >
                          {on && <Check className="size-3.5" strokeWidth={2.5} />}
                        </span>
                      </button>
                    </li>
                  )
                })}
                {!others.length && (
                  <li className="text-muted-foreground py-4 text-center text-sm">
                    {q ? 'Không tìm thấy ai phù hợp' : 'Mọi người đều đã ở trong dự án'}
                  </li>
                )}
              </ul>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">Vai trò</span>
                <Select value={role} onValueChange={(v) => setNewRole(v as ProjectRole)}>
                  <SelectTrigger size="sm" className="h-8 w-[150px]" aria-label="Vai trò khi mời">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Thành viên</SelectItem>
                    <SelectItem value="LEAD">Trưởng dự án</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="ml-auto" disabled={!picked.length || add.isPending} onClick={invite}>
                  {add.isPending && <Loader2 className="animate-spin" />}
                  {picked.length ? `Thêm ${picked.length} người` : 'Chọn người để thêm'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá {removing?.user.name} khỏi dự án?</AlertDialogTitle>
            <AlertDialogDescription>
              Người này sẽ không còn thấy dự án trong danh sách của mình. Các việc đã giao vẫn được giữ nguyên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                removing &&
                remove.mutate(removing.userId, {
                  onSuccess: () => toast.success(`Đã xoá ${removing.user.name} khỏi dự án`),
                  onError,
                })
              }
            >
              Xoá khỏi dự án
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
