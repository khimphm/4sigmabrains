import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import { useWorkspaceSettings } from './api'

const FALLBACK = '#64748B'

// Bản đồ tên nhãn -> màu, lấy từ Cài đặt workspace
export function useLabelColors() {
  const { data } = useWorkspaceSettings()
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const l of data?.taskLabels ?? []) map.set(l.name.toLowerCase(), l.color)
    return map
  }, [data])
}

export const labelColor = (map: Map<string, string>, name: string) => map.get(name.toLowerCase()) ?? FALLBACK

// Chip nhãn: nền nhạt + viền + chữ theo màu nhãn (đọc được ở cả nền sáng và tối)
export function LabelChip({ name, color, className }: { name: string; color?: string; className?: string }) {
  const c = color ?? FALLBACK
  return (
    <span
      className={cn(
        'inline-flex h-[22px] max-w-full items-center gap-1.5 truncate rounded-md border px-1.5 text-[12px] font-semibold',
        className,
      )}
      style={{
        color: `color-mix(in oklab, ${c} 82%, var(--foreground))`,
        backgroundColor: `color-mix(in oklab, ${c} 10%, transparent)`,
        borderColor: `color-mix(in oklab, ${c} 28%, transparent)`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: c }} aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  )
}
