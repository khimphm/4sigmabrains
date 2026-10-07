import { Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/brand-logo'
import { useTheme } from '@/lib/theme'
import { DrawingIllustration } from './drawing-illustration'

type Props = {
  children: ReactNode
  /** Tiêu đề lớn ở panel tối bên phải */
  tagline?: ReactNode
  description?: ReactNode
}

function ThemeButton() {
  const { resolved, setTheme } = useTheme()
  const dark = resolved === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="text-muted-foreground hover:bg-subtle hover:text-foreground focus-visible:ring-ring/50 grid size-9 cursor-pointer place-items-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-[3px]"
    >
      {dark ? <Sun className="size-[18px]" strokeWidth={1.8} /> : <Moon className="size-[18px]" strokeWidth={1.8} />}
    </button>
  )
}

export function AuthLayout({
  children,
  tagline = 'Cùng kiểm tra, gán nhãn và chốt kết quả bản vẽ ở một nơi.',
  description = 'Giao việc theo dự án, theo dõi hạn hoàn thành, trao đổi trên từng bản vẽ và thống nhất kết luận cùng cả nhóm.',
}: Props) {
  return (
    <div className="bg-card grid min-h-svh lg:grid-cols-2">
      <div className="flex min-h-svh flex-col px-4 py-6 sm:px-10 lg:px-16 xl:px-[160px]">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/login" className="rounded-md lg:hidden" aria-label="4SigmaBrains – về trang đăng nhập">
            <BrandLogo className="text-[15px]" />
          </Link>
          <ThemeButton />
        </div>
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10 lg:mx-0">
          <Link to="/login" className="mb-8 hidden w-fit rounded-md lg:block" aria-label="4SigmaBrains – về trang đăng nhập">
            <BrandLogo className="text-[15px]" markClassName="size-9" />
          </Link>
          {children}
        </main>
        <footer className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          <span>© {new Date().getFullYear()} 4SigmaBrains</span>
          <span aria-hidden="true">·</span>
          <span>Workspace nội bộ</span>
        </footer>
      </div>

      <aside className="bg-sidebar relative hidden overflow-hidden lg:flex lg:flex-col" aria-label="Giới thiệu 4SigmaBrains">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(127,162,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(127,162,255,.07) 1px,transparent 1px),linear-gradient(rgba(127,162,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(127,162,255,.035) 1px,transparent 1px)',
            backgroundSize: '96px 96px,96px 96px,24px 24px,24px 24px',
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -top-48 -right-40 size-[560px] rounded-full bg-[#1F4FD1] opacity-25 blur-[140px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 size-[420px] rounded-full bg-[#F0813F] opacity-[0.07] blur-[120px]" />

        <div className="relative flex items-center gap-2 px-12 pt-12 text-[13px] font-semibold text-[#8D99A6]">
          <span className="size-1.5 rounded-full bg-[#38B2A0] shadow-[0_0_0_3px_rgba(56,178,160,.18)]" />
          Workspace nội bộ
        </div>
        <div className="relative flex flex-1 items-center px-12 py-10 xl:px-20">
          <DrawingIllustration />
        </div>
        <div className="relative max-w-[560px] px-12 pb-12">
          <h2 className="text-[28px] leading-[1.25] font-extrabold tracking-tight text-balance text-white">{tagline}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#C3CCD6]">{description}</p>
        </div>
      </aside>
    </div>
  )
}
