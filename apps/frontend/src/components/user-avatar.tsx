import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Person {
  name: string
  avatarUrl?: string | null
}

// Màu nền ổn định theo tên để dễ nhận ra từng người
// Bộ màu avatar từ Figma
const PALETTE = ['bg-[#1F4FD1]', 'bg-[#7C3AED]', 'bg-[#0F766E]', 'bg-[#B45309]', 'bg-[#BE185D]']
const colorFor = (name: string) => PALETTE[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTE.length]

export function UserAvatar({ user, className, tooltip }: { user: Person; className?: string; tooltip?: boolean }) {
  const avatar = (
    <Avatar className={cn('size-7', className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn('text-[10px] font-semibold text-white', colorFor(user.name))}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  )
  if (!tooltip) return avatar
  return (
    <Tooltip>
      <TooltipTrigger asChild>{avatar}</TooltipTrigger>
      <TooltipContent>{user.name}</TooltipContent>
    </Tooltip>
  )
}

export function AvatarStack({ users, max = 4, className }: { users: Person[]; max?: number; className?: string }) {
  const shown = users.slice(0, max)
  return (
    <div className={cn('flex -space-x-2', className)}>
      {shown.map((u, i) => (
        <UserAvatar key={i} user={u} tooltip className="ring-card size-7 ring-2" />
      ))}
      {users.length > max && (
        <span className="bg-muted text-muted-foreground ring-card grid size-7 place-items-center rounded-full text-[10px] font-medium ring-2">
          +{users.length - max}
        </span>
      )}
    </div>
  )
}
