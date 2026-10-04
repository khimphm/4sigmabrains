import { useAuth } from '@/features/auth/use-auth'

export function HomePage() {
  const { user } = useAuth()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Xin chào, {user?.name}</h1>
      <p className="text-muted-foreground mt-1 text-sm">Khung ứng dụng đã sẵn sàng. Các module sẽ được thêm dần.</p>
    </div>
  )
}
