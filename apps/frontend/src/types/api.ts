// Kiểu dữ liệu trả về từ backend
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER'
export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  title: string | null
  department: string | null
  phone: string | null
  bio: string | null
  role: UserRole
  status: UserStatus
  emailNotifications: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
export type ProjectRole = 'LEAD' | 'MEMBER'

export interface ProjectMember {
  projectId: string
  userId: string
  role: ProjectRole
  user: User
}

export interface Project {
  id: string
  name: string
  key: string
  description: string | null
  color: string
  status: ProjectStatus
  startDate: string | null
  dueDate: string | null
  ownerId: string
  owner: User
  members: ProjectMember[]
  stats: { total: number; done: number; overdue: number }
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface ChecklistItem {
  id: string
  taskId: string
  content: string
  done: boolean
  position: number
}

export interface Task {
  id: string
  projectId: string
  project: Pick<Project, 'id' | 'name' | 'key' | 'color'>
  number: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  assignee: User | null
  reporterId: string
  reporter?: User
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  labels: string[]
  position: number
  checklist?: ChecklistItem[]
  checklistTotal?: number
  checklistDone?: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  authorId: string
  author: User
  body: string
  mentionIds: string[]
  createdAt: string
}

export interface Attachment {
  id: string
  fileName: string
  mimeType: string
  size: number
  uploader: User
  createdAt: string
}

export interface Discussion {
  id: string
  projectId: string | null
  project: Pick<Project, 'id' | 'name' | 'key' | 'color'> | null
  title: string
  body: string
  author: User
  authorId: string
  mentionIds: string[]
  pinned: boolean
  replyCount: number
  lastActivityAt: string
  createdAt: string
  replies?: Comment[]
}

export type DecisionStatus = 'OPEN' | 'DECIDED' | 'CANCELLED'

export interface DecisionOption {
  id: string
  title: string
  description: string | null
  pros: string[]
  cons: string[]
  position: number
}

export interface DecisionVote {
  id: string
  optionId: string
  userId: string
  user: User
  comment: string | null
}

export interface Decision {
  id: string
  projectId: string | null
  project: Pick<Project, 'id' | 'name' | 'key' | 'color'> | null
  title: string
  context: string
  status: DecisionStatus
  dueDate: string | null
  owner: User
  ownerId: string
  chosenOptionId: string | null
  rationale: string | null
  decidedAt: string | null
  options: DecisionOption[]
  votes?: DecisionVote[]
  voteCount?: number
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  actor: User | null
  createdAt: string
}

export interface Activity {
  id: string
  actor: User | null
  entityType: 'project' | 'task' | 'discussion' | 'decision' | 'user'
  entityId: string
  projectId: string | null
  action: string
  summary: string
  meta: Record<string, unknown>
  createdAt: string
}

export interface DashboardData {
  me: { open: number; overdue: number; dueToday: number; dueThisWeek: number; doneThisWeek: number }
  onTime: { onTime: number; late: number; rate: number | null }
  members: { id: string; name: string; avatarUrl: string | null; open: number; overdue: number; onTime: number; late: number }[]
  byStatus: Partial<Record<TaskStatus, number>>
  projects: { id: string; name: string; key: string; color: string; dueDate: string | null; total: number; done: number; overdue: number }[]
  openDecisions: number
  recentActivity: Activity[]
}
