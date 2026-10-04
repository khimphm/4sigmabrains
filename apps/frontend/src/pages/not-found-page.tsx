import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="from-primary bg-gradient-to-br to-violet-500 bg-clip-text text-7xl font-bold text-transparent">404</div>
      <p className="text-muted-foreground mt-2">Không tìm thấy trang bạn cần.</p>
      <Button asChild className="mt-6">
        <Link to="/">Về trang tổng quan</Link>
      </Button>
    </div>
  )
}
