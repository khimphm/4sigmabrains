import { Loader2, Pencil, Target } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { errorMessage } from '@/lib/api'
import type { TaskDetail } from '@/types/api'
import { useUpdateTask } from '../api'
import { SectionCard } from './section-card'

export function DescriptionCard({ task }: { task: TaskDetail }) {
  const update = useUpdateTask()
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState('')
  const [ac, setAc] = useState('')

  const start = () => {
    setDesc(task.description ?? '')
    setAc(task.acceptanceCriteria ?? '')
    setEditing(true)
  }
  const save = () =>
    update.mutate(
      { id: task.id, description: desc.trim() || null, acceptanceCriteria: ac.trim() || null },
      {
        onSuccess: () => (setEditing(false), toast.success('Đã lưu mô tả')),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )

  return (
    <SectionCard
      id="task-description"
      title="Mô tả công việc"
      aside={
        !editing && (
          <Button variant="ghost" size="sm" onClick={start} className="text-text-secondary">
            <Pencil className="size-3.5" strokeWidth={1.8} /> Sửa
          </Button>
        )
      }
    >
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="desc-edit" className="text-text-secondary text-[13px] font-semibold">
              Mô tả
            </Label>
            <Textarea
              id="desc-edit"
              autoFocus
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={5}
              placeholder="Cần làm gì, phạm vi, lưu ý…"
              className="text-[15px] leading-relaxed"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-edit" className="text-text-secondary text-[13px] font-semibold">
              Tiêu chí hoàn thành
            </Label>
            <Textarea
              id="ac-edit"
              value={ac}
              onChange={(e) => setAc(e.target.value)}
              rows={3}
              placeholder="Thế nào là xong? Vd: Đủ 20 bản vẽ có nhãn, trưởng nhóm duyệt không quá 10% phải sửa"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Huỷ
            </Button>
            <Button variant="outline" onClick={save} disabled={update.isPending} className="font-semibold">
              {update.isPending && <Loader2 className="animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {task.description ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{task.description}</p>
          ) : (
            <button
              type="button"
              onClick={start}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-[15px] transition-colors"
            >
              Chưa có mô tả. Bấm để thêm yêu cầu, phạm vi, lưu ý…
            </button>
          )}
          <div className="bg-subtle rounded-lg px-4 py-3">
            <p className="text-text-secondary flex items-center gap-1.5 text-[13px] font-semibold">
              <Target className="size-3.5" strokeWidth={1.8} aria-hidden />
              Tiêu chí hoàn thành
            </p>
            {task.acceptanceCriteria ? (
              <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-wrap">{task.acceptanceCriteria}</p>
            ) : (
              <button
                type="button"
                onClick={start}
                className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer text-sm transition-colors"
              >
                Chưa đặt tiêu chí. Thêm để mọi người biết thế nào là xong.
              </button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
