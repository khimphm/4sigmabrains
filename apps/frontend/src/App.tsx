import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { FullPageLoader } from '@/components/full-page-loader'
import { RequireAdmin, RequireAuth } from '@/features/auth/require-auth'
import { DashboardPage } from '@/pages/dashboard-page'
import { LoginPage } from '@/pages/login-page'
import { PendingPage } from '@/pages/pending-page'

// Tải trang theo nhu cầu để lần mở đầu nhanh hơn
const AdminMembersPage = lazy(() => import('@/pages/admin-members-page').then((m) => ({ default: m.AdminMembersPage })))
const DatasetPage = lazy(() => import('@/pages/dataset-page').then((m) => ({ default: m.DatasetPage })))
const DecisionDetailPage = lazy(() => import('@/pages/decision-detail-page').then((m) => ({ default: m.DecisionDetailPage })))
const DecisionNewPage = lazy(() => import('@/pages/decision-new-page').then((m) => ({ default: m.DecisionNewPage })))
const DecisionsPage = lazy(() => import('@/pages/decisions-page').then((m) => ({ default: m.DecisionsPage })))
const DiscussionDetailPage = lazy(() => import('@/pages/discussion-detail-page').then((m) => ({ default: m.DiscussionDetailPage })))
const DiscussionsPage = lazy(() => import('@/pages/discussions-page').then((m) => ({ default: m.DiscussionsPage })))
const MyTasksPage = lazy(() => import('@/pages/my-tasks-page').then((m) => ({ default: m.MyTasksPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((m) => ({ default: m.NotFoundPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications-page').then((m) => ({ default: m.NotificationsPage })))
const ProfilePage = lazy(() => import('@/pages/profile-page').then((m) => ({ default: m.ProfilePage })))
const ProjectDetailPage = lazy(() => import('@/pages/project-detail-page').then((m) => ({ default: m.ProjectDetailPage })))
const ProjectsPage = lazy(() => import('@/pages/projects-page').then((m) => ({ default: m.ProjectsPage })))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="my-tasks" element={<MyTasksPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="discussions" element={<DiscussionsPage />} />
            <Route path="discussions/:id" element={<DiscussionDetailPage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="decisions/new" element={<DecisionNewPage />} />
            <Route path="decisions/:id" element={<DecisionDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="dataset" element={<DatasetPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="admin/members" element={<AdminMembersPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
