import { Crown, UserMinus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/user-avatar'
import { useUsers } from '@/features/users/api'
import { errorMessage } from '@/lib/api'
import type { Project } from '@/types/api'
import { useProjectMembers } from './api'

export function MembersDialog({ project, open, onOpenChange, canEdit }: {
  project: Project
  open: boolean
  onOpenChange: (o: boolean) => void
  canEdit: boolean
}) {
  const { data: users = [] } = useUsers()
  const { add, setRole, remove } = useProjectMembers(project.id)
  const memberIds = new Set(project.members.map((m) => m.userId))
  const others = users.filter((u) => !memberIds.has(u.id))
  const onError = (e: unknown) => toast.error(errorMessage(e))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thành viên dự án</DialogTitle>
          <DialogDescription>{project.members.length} người đang tham gia {project.name}</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {project.members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <UserAvatar user={m.user} className="size-8" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.user.name}</div>
                <div className="text-muted-foreground truncate text-xs">{m.user.title || m.user.email}</div>
              </div>
              {m.role === 'LEAD' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                  <Crown className="size-3" /> Trưởng dự án
                </span>
              )}
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setRole.mutate({ userId: m.userId, role: m.role === 'LEAD' ? 'MEMBER' : 'LEAD' }, { onError })}
                  >
                    {m.role === 'LEAD' ? 'Bỏ trưởng' : 'Đặt trưởng'}
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 hover:text-red-600" onClick={() => remove.mutate(m.userId, { onError })} aria-label="Xoá khỏi dự án">
                    <UserMinus className="size-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        {canEdit && others.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Thêm người</p>
            <div className="flex flex-wrap gap-1.5">
              {others.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => add.mutate([u.id], { onError })}
                  className="hover:bg-muted flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-xs"
                >
                  <UserAvatar user={u} className="size-5" />+ {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
