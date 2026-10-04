export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">Đang xây dựng.</p>
    </div>
  )
}
