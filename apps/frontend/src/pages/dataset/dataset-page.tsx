import { CheckCircle2, Database, FileSearch, Tags, Users } from 'lucide-react'

import { PageContainer, PageHeader } from '@/components/page-header'

const steps = [
  { icon: FileSearch, title: 'Tải bản vẽ lên', text: 'PDF/ảnh bản vẽ kỹ thuật, gom theo dự án và loại bản vẽ' },
  { icon: Tags, title: 'Đánh dấu lỗi', text: 'Khoanh vùng, gắn loại lỗi/thiếu sót, mức độ nghiêm trọng' },
  { icon: Users, title: 'Kiểm tra chéo', text: 'Người thứ hai duyệt nhãn để đảm bảo chất lượng dữ liệu' },
  { icon: CheckCircle2, title: 'Xuất dữ liệu huấn luyện', text: 'Xuất định dạng cho fine-tune và RL mô hình đọc bản vẽ' },
]

export function DatasetPage() {
  return (
    <PageContainer>
      <PageHeader title="Dataset bản vẽ" description="Module giai đoạn 2: xây bộ dữ liệu để huấn luyện AI phát hiện lỗi bản vẽ" />
      <div className="bg-sidebar relative overflow-hidden rounded-2xl p-8 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#1F4FD1] opacity-40 blur-[100px]" />
        <Database className="relative size-10 text-[#7FA2FF]" />
        <h2 className="relative mt-4 text-xl font-semibold">Đang chuẩn bị</h2>
        <p className="relative mt-2 max-w-xl text-sm text-white/60">
          Cấu trúc code đã chừa sẵn chỗ cho module này. Khi bắt đầu giai đoạn 2, quy trình dự kiến gồm 4 bước bên dưới.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary grid size-8 place-items-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <span className="text-muted-foreground text-xs">Bước {i + 1}</span>
            </div>
            <h3 className="mt-3 font-medium">{title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{text}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
