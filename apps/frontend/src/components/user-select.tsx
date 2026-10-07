import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsers } from '@/features/users/api'
import { UserAvatar } from './user-avatar'

const NONE = '__none__'

export function UserSelect({ value, onChange, placeholder = 'Chưa giao', className, allowEmpty = true }: {
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  className?: string
  allowEmpty?: boolean
}) {
  const { data: users = [] } = useUsers()
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value={NONE}>{placeholder}</SelectItem>}
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            <span className="flex items-center gap-2">
              <UserAvatar user={u} className="size-5" />
              {u.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
