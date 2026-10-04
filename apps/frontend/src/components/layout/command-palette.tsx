import { useQuery } from '@tanstack/react-query'
import { CheckSquare, FolderKanban, Gavel, LayoutDashboard, MessagesSquare, Moon, Plus, Sun, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { get } from '@/lib/api'
import { useTheme } from '@/lib/theme'

interface SearchResult {
  projects: { id: string; name: string; key: string; color: string }[]
  tasks: { id: string; title: string; number: number; key: string; projectId: string }[]
  users: { id: string; name: string; email: string }[]
  discussions: { id: string; title: string }[]
  decisions: { id: string; title: string }[]
}

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const { resolved, setTheme } = useTheme()
  const [q, setQ] = useState('')
  const term = useDebounced(q.trim())
  const { data } = useQuery({
    queryKey: ['search', term],
    queryFn: () => get<SearchResult>(`/search?q=${encodeURIComponent(term)}`),
    enabled: term.length >= 2,
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const go = (path: string) => {
    onOpenChange(false)
    setQ('')
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Tìm kiếm" description="Tìm dự án, công việc, người, thảo luận">
      <CommandInput placeholder="Tìm dự án, công việc (vd: TA-12), người, thảo luận…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        {!!data?.tasks.length && (
          <CommandGroup heading="Công việc">
            {data.tasks.map((t) => (
              <CommandItem key={t.id} value={`task-${t.id}`} onSelect={() => go(`/projects/${t.projectId}?task=${t.id}`)}>
                <CheckSquare />
                <span className="text-muted-foreground font-mono text-xs">{t.key}-{t.number}</span>
                {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.projects.length && (
          <CommandGroup heading="Dự án">
            {data.projects.map((p) => (
              <CommandItem key={p.id} value={`project-${p.id}`} onSelect={() => go(`/projects/${p.id}`)}>
                <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.discussions.length && (
          <CommandGroup heading="Thảo luận">
            {data.discussions.map((d) => (
              <CommandItem key={d.id} value={`disc-${d.id}`} onSelect={() => go(`/discussions/${d.id}`)}>
                <MessagesSquare />
                {d.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.decisions.length && (
          <CommandGroup heading="Quyết định">
            {data.decisions.map((d) => (
              <CommandItem key={d.id} value={`dec-${d.id}`} onSelect={() => go(`/decisions/${d.id}`)}>
                <Gavel />
                {d.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.users.length && (
          <CommandGroup heading="Thành viên">
            {data.users.map((u) => (
              <CommandItem key={u.id} value={`user-${u.id}`} onSelect={() => go(`/my-tasks?assignee=${u.id}`)}>
                <User />
                {u.name}
                <span className="text-muted-foreground text-xs">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Đi tới">
          <CommandItem onSelect={() => go('/')}><LayoutDashboard />Tổng quan</CommandItem>
          <CommandItem onSelect={() => go('/my-tasks')}><CheckSquare />Việc của tôi</CommandItem>
          <CommandItem onSelect={() => go('/projects')}><FolderKanban />Dự án</CommandItem>
          <CommandItem onSelect={() => go('/discussions?new=1')}><Plus />Tạo thảo luận mới</CommandItem>
          <CommandItem onSelect={() => go('/decisions/new')}><Plus />Tạo quyết định mới</CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(resolved === 'dark' ? 'light' : 'dark')
              onOpenChange(false)
            }}
          >
            {resolved === 'dark' ? <Sun /> : <Moon />}
            Chuyển giao diện {resolved === 'dark' ? 'sáng' : 'tối'}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
