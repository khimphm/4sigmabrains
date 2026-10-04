import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { RequireAuth } from '@/features/auth/require-auth'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { PendingPage } from '@/pages/pending-page'
import { PlaceholderPage } from '@/pages/placeholder-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="my-tasks" element={<PlaceholderPage title="Việc của tôi" />} />
            <Route path="projects" element={<PlaceholderPage title="Dự án" />} />
            <Route path="discussions" element={<PlaceholderPage title="Thảo luận" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
