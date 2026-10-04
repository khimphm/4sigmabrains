import { ArrowLeft, Minus, Plus, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageContainer, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type OptionInput, useCreateDecision } from '@/features/decisions/api'
import { useProjects } from '@/features/projects/api'
import { FormField } from '@/features/tasks/task-form-dialog'
import { errorMessage } from '@/lib/api'
import { fromLocalInput } from '@/lib/format'

const emptyOption = (): OptionInput => ({ title: '', description: '', pros: [''], cons: [''] })
const GENERAL = '__general__'

export function ListEditor({ items, onChange, placeholder, icon: Icon, tone }: {
  items: string[]
  onChange: (v: string[]) => void
  placeholder: string
  icon: typeof ThumbsUp
  tone: string
}) {
  return (
    <div className="space-y-1.5">
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Icon className={`size-4 shrink-0 ${tone}`} />
          <Input
            value={v}
            placeholder={placeholder}
            className="h-8"
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onChange([...items.slice(0, i + 1), '', ...items.slice(i + 1)])
              }
            }}
          />
          {items.length > 1 && (
            <button type="button" className="text-muted-foreground hover:text-red-600" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Bỏ dòng">
              <Minus className="size-4" />
            </button>
          )}
        </div>
      ))}
      <button type="button" className="text-muted-foreground hover:text-foreground text-xs" onClick={() => onChange([...items, ''])}>
        + Thêm dòng
      </button>
    </div>
  )
}

export function OptionEditor({ option, index, onChange, onRemove }: {
  option: OptionInput
  index: number
  onChange: (o: OptionInput) => void
  onRemove?: () => void
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="bg-primary/10 text-primary grid size-7 place-items-center rounded-lg text-sm font-semibold">{String.fromCharCode(65 + index)}</span>
        <Input required value={option.title} onChange={(e) => onChange({ ...option, title: e.target.value })} placeholder="Tên phương án" className="font-medium" />
        {onRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Xoá phương án">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <Textarea value={option.description} onChange={(e) => onChange({ ...option, description: e.target.value })} placeholder="Mô tả ngắn (chi phí, thời gian, rủi ro…)" rows={2} />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium text-emerald-600">Ưu điểm</div>
          <ListEditor items={option.pros} onChange={(pros) => onChange({ ...option, pros })} placeholder="Ưu điểm" icon={ThumbsUp} tone="text-emerald-600" />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-red-600">Nhược điểm</div>
          <ListEditor items={option.cons} onChange={(cons) => onChange({ ...option, cons })} placeholder="Nhược điểm" icon={ThumbsDown} tone="text-red-600" />
        </div>
      </div>
    </div>
  )
}

export function DecisionNewPage() {
  const navigate = useNavigate()
  const create = useCreateDecision()
  const { data: projects = [] } = useProjects()
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [projectId, setProjectId] = useState(GENERAL)
  const [dueDate, setDueDate] = useState('')
  const [options, setOptions] = useState<OptionInput[]>([emptyOption(), emptyOption()])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      {
        title,
        context,
        projectId: projectId === GENERAL ? null : projectId,
        dueDate: fromLocalInput(dueDate),
        options: options.map((o) => ({ ...o, pros: o.pros.filter((p) => p.trim()), cons: o.cons.filter((c) => c.trim()) })),
      },
      {
        onSuccess: (d) => (toast.success('Đã tạo, mọi người sẽ nhận thông báo để cho ý kiến'), navigate(`/decisions/${d.id}`)),
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <PageContainer>
      <Link to="/decisions" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Phân tích & quyết định
      </Link>
      <PageHeader title="Quyết định mới" description="Mô tả vấn đề, đưa ra ít nhất 2 phương án. Cả đội sẽ bình chọn và góp ý." />
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <div className="bg-card space-y-4 rounded-xl border p-5">
          <FormField label="Cần quyết định điều gì?">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="vd: Chọn model AI để fine-tune cho đọc bản vẽ" className="h-11 text-base" />
          </FormField>
          <FormField label="Bối cảnh, vấn đề, tiêu chí đánh giá">
            <Textarea required value={context} onChange={(e) => setContext(e.target.value)} rows={5} placeholder="Tại sao cần quyết định? Ràng buộc là gì? Tiêu chí nào quan trọng nhất?" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Thuộc">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENERAL}>Chung toàn công ty</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Hạn chốt">
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="font-semibold">Các phương án</h2>
          {options.map((o, i) => (
            <OptionEditor
              key={i}
              option={o}
              index={i}
              onChange={(next) => setOptions((prev) => prev.map((x, j) => (j === i ? next : x)))}
              onRemove={options.length > 2 ? () => setOptions((prev) => prev.filter((_, j) => j !== i)) : undefined}
            />
          ))}
          <Button type="button" variant="outline" onClick={() => setOptions((p) => [...p, emptyOption()])}>
            <Plus /> Thêm phương án
          </Button>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" asChild>
            <Link to="/decisions">Huỷ</Link>
          </Button>
          <Button type="submit" disabled={create.isPending}>
            Tạo & mời góp ý
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
