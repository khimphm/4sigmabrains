import { CalendarCheck, Gavel, KanbanSquare, MessagesSquare } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { useAuth } from '@/features/auth/use-auth'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

const features = [
  { icon: KanbanSquare, title: 'Dự án & công việc', text: 'Kanban, danh sách, lịch, checklist và file đính kèm' },
  { icon: CalendarCheck, title: 'Không trễ hạn', text: 'Tự nhắc trước hạn, theo dõi tỉ lệ đúng hạn từng người' },
  { icon: MessagesSquare, title: 'Thảo luận', text: 'Trao đổi theo chủ đề, @nhắc tên đồng đội' },
  { icon: Gavel, title: 'Ra quyết định', text: 'So sánh phương án, bình chọn và lưu lại lý do' },
]

export function LoginPage() {
  const { user, isLoading } = useAuth()
  const error = new URLSearchParams(window.location.search).get('error')
  if (!isLoading && user) return <Navigate to={user.status === 'ACTIVE' ? '/' : '/pending'} replace />

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <div className="bg-sidebar relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-[#1F4FD1] opacity-40 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-[420px] rounded-full bg-[#7C3AED] opacity-25 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <BrandLogo className="relative text-lg" />
        <div className="relative my-auto max-w-lg">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">
            Không gian làm việc
            <br />
            <span className="bg-gradient-to-r from-[#7FA2FF] to-[#C4B5FD] bg-clip-text text-transparent">của đội 4SigmaBrains</span>
          </h1>
          <p className="mt-4 text-white/60">Một nơi để giao việc, theo dõi tiến độ, thảo luận và ra quyết định cùng nhau.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <Icon className="size-5 text-[#7FA2FF]" />
                <div className="mt-3 text-sm font-medium">{title}</div>
                <div className="mt-1 text-xs text-white/50">{text}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} 4SigmaBrains</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <BrandLogo className="mb-10 lg:hidden" />
          <h2 className="text-2xl font-semibold tracking-tight">Đăng nhập</h2>
          <p className="text-muted-foreground mt-2 text-sm">Dùng tài khoản Google của bạn. Lần đầu đăng nhập cần quản trị viên duyệt.</p>
          {error && (
            <p className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-sm">
              Đăng nhập không thành công. Có thể email của bạn không thuộc tổ chức, vui lòng thử lại.
            </p>
          )}
          <a
            href="/api/auth/google"
            className="bg-card hover:bg-muted mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-sm font-medium shadow-xs transition-all hover:shadow-md"
          >
            <GoogleIcon />
            Tiếp tục với Google
          </a>
          <p className="text-muted-foreground mt-6 text-center text-xs">Chỉ dành cho thành viên nội bộ.</p>
        </div>
      </div>
    </div>
  )
}
