import { useMemo } from 'react'

import { PROJECT_COLORS } from '@/lib/constants'
import type { Project, ProjectRole } from '@/types/api'
import { useWorkspaceSettings } from './api'

// Màu dự án từ Figma đứng đầu, sau đó là bảng màu mở rộng
export const PROJECT_PALETTE = [...new Set(['#4F7CF5', '#E08A3C', '#38B2A0', ...PROJECT_COLORS])]

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = { LEAD: 'Trưởng dự án', MEMBER: 'Thành viên' }

export const projectPct = (p: Pick<Project, 'stats'>) => (p.stats.total ? Math.round((p.stats.done / p.stats.total) * 100) : 0)

export const projectLead = (p: Project) => p.members.find((m) => m.role === 'LEAD')?.user ?? p.owner

export const LABEL_FALLBACK = '#64748B'

// Bản đồ tên nhãn -> màu, lấy từ Cài đặt workspace
export function useLabelColors() {
  const { data } = useWorkspaceSettings()
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const l of data?.taskLabels ?? []) map.set(l.name.toLowerCase(), l.color)
    return map
  }, [data])
}

export const labelColor = (map: Map<string, string>, name: string) => map.get(name.toLowerCase()) ?? LABEL_FALLBACK
