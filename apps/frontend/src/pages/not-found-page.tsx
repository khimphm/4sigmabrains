import { ArrowLeft, Compass, Home } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { PageTopbar } from '@/components/layout/topbar-slot'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-12">
      <PageTopbar crumbs={[{ label: 'Không tìm thấy trang' }]} />
      <div className="bg-card shadow-card relative w-full max-w-md overflow-hidden rounded-[10px] border px-6 py-10 text-center sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_65%)] opacity-60"
        />
        <div className="relative">
          <span className="bg-primary-soft text-primary mx-auto grid size-12 place-items-center rounded-xl">
            <Compass className="size-6" strokeWidth={1.8} />
          </span>
          <p className="text-muted-foreground num mt-5 text-[13px] font-semibold tracking-[0.2em]">LỖI 404</p>
          <h1 className="mt-1 text-[28px] leading-tight font-extrabold tracking-tight">Không tìm thấy trang</h1>
          <p className="text-text-secondary mt-2 text-[15px]">
            Đường dẫn có thể đã bị đổi, bị xoá hoặc bạn không có quyền xem.
          </p>
          <code className="bg-subtle text-muted-foreground mt-4 inline-block max-w-full truncate rounded-md px-2 py-1 text-[12px]">
            {pathname}
          </code>
          <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft /> Quay lại
            </Button>
            <Button asChild>
              <Link to="/">
                <Home /> Về Bảng làm việc
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
