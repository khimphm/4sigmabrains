// Kiểu dữ liệu trả về từ backend
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'CLIENT'
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
  webNotifications: boolean
  remind24h: boolean
  remind2h: boolean
  totpEnabled: boolean
  skills: string[]
  clientId: string | null
  client?: Client | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
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
  clientId: string | null
  client: Client | null
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
  completedById: string | null
  completedBy: User | null
  completedAt: string | null
}

export interface Task {
  id: string
  projectId: string
  project: Pick<Project, 'id' | 'name' | 'key' | 'color'>
  number: number
  title: string
  description: string | null
  acceptanceCriteria: string | null
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
  attachmentCount?: number
  commentCount?: number
  createdAt: string
  updatedAt: string
}

// GET /tasks/:id
export interface TaskDetail extends Task {
  watchers: User[]
  watching: boolean
  reminders: { reminder24hSentAt: string | null; reminder2hSentAt: string | null; overdueNotifiedAt: string | null }
}

export interface Comment {
  id: string
  authorId: string
  author: User
  body: string
  mentionIds: string[]
  createdAt: string
}

export type AttachmentTarget = 'TASK' | 'PROJECT' | 'DISCUSSION'

export interface Attachment {
  id: string
  targetType: AttachmentTarget
  targetId: string
  projectId: string | null
  fileName: string
  mimeType: string
  size: number
  version: number
  previousId: string | null
  isLatest: boolean
  sharedWithClient: boolean
  uploaderId: string
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
export type OpinionKind = 'OPINION' | 'QUESTION' | 'PROPOSAL'

export interface DecisionOpinion {
  id: string
  decisionId: string
  parentId: string | null
  kind: OpinionKind
  body: string
  mentionIds: string[]
  authorId: string
  author: User
  agreeCount: number
  agreedByMe: boolean
  agreedBy: { id: string; name: string }[]
  createdAt: string
  replies?: DecisionOpinion[]
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
  conclusion: string | null
  decidedById: string | null
  decidedBy: User | null
  decidedAt: string | null
  opinionCount?: number
  participantCount?: number
  createdAt: string
  updatedAt: string
}

// GET /decisions/:id
export interface DecisionDetail extends Decision {
  opinions: DecisionOpinion[]
  summary: { id: string; body: string; agreeCount: number; author: string }[]
  canDecide: boolean
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
  entityType: 'project' | 'task' | 'discussion' | 'decision' | 'user' | 'file' | 'drawing' | 'client'
  entityId: string
  projectId: string | null
  action: string
  summary: string
  meta: Record<string, unknown>
  createdAt: string
}

export interface DashboardTodayTask {
  id: string
  title: string
  number: number
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  completedAt: string | null
  labels: string[]
  project: { id: string; key: string; color: string; name: string }
}

export interface DashboardData {
  me: { open: number; overdue: number; dueToday: number; dueThisWeek: number; doneThisWeek: number; dueSoon: number }
  month: { onTime: number; late: number; rate: number | null }
  today: DashboardTodayTask[]
  pendingDecisions: { id: string; title: string; dueDate: string | null; projectName: string | null; color: string | null; opinions: number }[]
  onTime: { onTime: number; late: number; rate: number | null }
  members: { id: string; name: string; avatarUrl: string | null; open: number; overdue: number; onTime: number; late: number }[]
  byStatus: Partial<Record<TaskStatus, number>>
  projects: {
    id: string
    name: string
    key: string
    color: string
    dueDate: string | null
    clientName: string | null
    leadName: string | null
    total: number
    done: number
    overdue: number
  }[]
  openDecisions: number
  recentActivity: Activity[]
}

export interface WorkspaceSettings {
  company: { name: string; shortName: string; address: string; phone: string; email: string; website: string }
  taskLabels: { name: string; color: string }[]
  workHours: { start: string; end: string; workDays: number[] }
}
