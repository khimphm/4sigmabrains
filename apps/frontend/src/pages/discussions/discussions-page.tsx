import { Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { PageTopbar } from '@/components/layout/topbar-slot'
import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { DiscussionList } from '@/features/discussions/discussion-list'

export function DiscussionsPage() {
  const [params, setParams] = useSearchParams()
  // ?new=1 mở hộp thoại tạo mới (dùng từ thanh lệnh / liên kết ngoài)
  const creating = params.get('new') === '1'
  const setCreating = (o: boolean) =>
    setParams(
      (p) => {
        if (o) p.set('new', '1')
        else p.delete('new')
        return p
      },
      { replace: true },
    )

  return (
    <PageContainer>
      <PageTopbar
        crumbs={[{ label: 'Cộng tác' }, { label: 'Thảo luận' }]}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> <span className="max-sm:hidden">Thảo luận mới</span>
          </Button>
        }
      />
      <PageHeader title="Thảo luận" description="Trao đổi theo chủ đề, gõ @ để nhắc tên đồng đội. Chủ đề quan trọng được ghim lên đầu." />
      <DiscussionList showCreate={false} creating={creating} onCreatingChange={setCreating} />
    </PageContainer>
  )
}
