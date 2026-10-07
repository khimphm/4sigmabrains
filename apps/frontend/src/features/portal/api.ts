import { useQuery } from '@tanstack/react-query'

import { get } from '@/lib/api'
import type { ProjectStatus, TaskStatus } from '@/types/api'

// GET /portal/overview
export interface PortalProjectSummary {
  id: string
  name: string
  key: string
  color: string
  status: ProjectStatus
  dueDate: string | null
  total: number
  done: number
  overdue: number
  lastCompletedAt: string | null
}

export interface PortalOverview {
  client: { id: string; name: string } | undefined
  projects: PortalProjectSummary[]
}

// GET /portal/projects/:id
export interface PortalProject {
  id: string
  name: string
  key: string
  color: string
  status: ProjectStatus
  description: string | null
  startDate: string | null
  dueDate: string | null
  leadName: string
  leadEmail: string
}

export interface PortalTask {
  id: string
  number: number
  title: string
  status: TaskStatus
  dueDate: string | null
  completedAt: string | null
  assigneeName: string | null
}

export interface PortalFile {
  id: string
  fileName: string
  mimeType: string
  size: number
  version: number
  createdAt: string
  uploaderName: string
}

export interface PortalMilestone {
  number: number
  title: string
  completedAt: string | null
  dueDate: string | null
}

export interface PortalProjectDetail {
  project: PortalProject
  tasks: PortalTask[]
  files: PortalFile[]
  milestones: PortalMilestone[]
}

export const usePortalOverview = () =>
  useQuery({ queryKey: ['portal', 'overview'], queryFn: () => get<PortalOverview>('/portal/overview') })

export const usePortalProject = (id: string | undefined) =>
  useQuery({
    queryKey: ['portal', 'projects', id],
    queryFn: () => get<PortalProjectDetail>(`/portal/projects/${id}`),
    enabled: !!id,
  })

export const portalFileUrl = (id: string) => `/api/portal/files/${id}`

export const progressOf = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0)
