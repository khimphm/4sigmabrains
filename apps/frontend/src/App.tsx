import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { FullPageLoader } from '@/components/full-page-loader'
import { RequireAdmin, RequireAuth, RequireClient } from '@/features/auth/require-auth'
import { DashboardPage } from '@/pages/dashboard-page'
import { LoginPage } from '@/pages/auth/login-page'

// Tải trang theo nhu cầu để lần mở đầu nhanh hơn
const page = <M extends Record<string, ComponentType<any>>>(load: () => Promise<M>, name: keyof M) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

// Nhóm Tài khoản
const RegisterPage = page(() => import('@/pages/auth/register-page'), 'RegisterPage')
const ForgotPasswordPage = page(() => import('@/pages/auth/forgot-password-page'), 'ForgotPasswordPage')
const ResetPasswordPage = page(() => import('@/pages/auth/reset-password-page'), 'ResetPasswordPage')
const PendingPage = page(() => import('@/pages/auth/pending-page'), 'PendingPage')

// Nhóm Làm việc
const MyTasksPage = page(() => import('@/pages/my-tasks-page'), 'MyTasksPage')
const NotificationsPage = page(() => import('@/pages/notifications-page'), 'NotificationsPage')
const ReportsPage = page(() => import('@/pages/reports-page'), 'ReportsPage')

// Nhóm Dự án
const ProjectsPage = page(() => import('@/pages/projects/projects-page'), 'ProjectsPage')
const ProjectDetailPage = page(() => import('@/pages/projects/project-detail-page'), 'ProjectDetailPage')
const TaskDetailPage = page(() => import('@/pages/tasks/task-detail-page'), 'TaskDetailPage')

// Nhóm Cộng tác
const DecisionsPage = page(() => import('@/pages/decisions/decisions-page'), 'DecisionsPage')
const DiscussionsPage = page(() => import('@/pages/discussions/discussions-page'), 'DiscussionsPage')
const DiscussionDetailPage = page(() => import('@/pages/discussions/discussion-detail-page'), 'DiscussionDetailPage')
const FilesPage = page(() => import('@/pages/files/files-page'), 'FilesPage')
const DatasetPage = page(() => import('@/pages/dataset/dataset-page'), 'DatasetPage')
const DrawingPage = page(() => import('@/pages/dataset/drawing-page'), 'DrawingPage')
const MembersPage = page(() => import('@/pages/people/members-page'), 'MembersPage')
const MemberProfilePage = page(() => import('@/pages/people/member-profile-page'), 'MemberProfilePage')
const ClientsPage = page(() => import('@/pages/people/clients-page'), 'ClientsPage')
const ClientDetailPage = page(() => import('@/pages/people/client-detail-page'), 'ClientDetailPage')

// Nhóm Cá nhân & Hệ thống
const ProfilePage = page(() => import('@/pages/profile/profile-page'), 'ProfilePage')
const SettingsPage = page(() => import('@/pages/settings/settings-page'), 'SettingsPage')
const NotFoundPage = page(() => import('@/pages/not-found-page'), 'NotFoundPage')

// Cổng khách hàng
const PortalLayout = page(() => import('@/pages/portal/portal-layout'), 'PortalLayout')
const PortalHomePage = page(() => import('@/pages/portal/portal-home-page'), 'PortalHomePage')
const PortalProjectPage = page(() => import('@/pages/portal/portal-project-page'), 'PortalProjectPage')

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/pending" element={<PendingPage />} />

          <Route element={<RequireClient />}>
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalHomePage />} />
              <Route path="projects/:id" element={<PortalProjectPage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="my-tasks" element={<MyTasksPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />

              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />

              <Route path="decisions" element={<DecisionsPage />} />
              <Route path="decisions/:id" element={<DecisionsPage />} />
              <Route path="discussions" element={<DiscussionsPage />} />
              <Route path="discussions/:id" element={<DiscussionDetailPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="dataset" element={<DatasetPage />} />
              <Route path="dataset/drawings/:id" element={<DrawingPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="members/:id" element={<MemberProfilePage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />

              <Route path="profile" element={<ProfilePage />} />
              <Route element={<RequireAdmin />}>
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              {/* Đường dẫn cũ */}
              <Route path="admin/members" element={<Navigate to="/members" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
