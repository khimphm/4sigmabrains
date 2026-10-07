import { HelpCircle, Lightbulb, MessageSquareText, type LucideIcon } from 'lucide-react'

import type { OpinionKind } from '@/types/api'

// Loại góp ý: tông trung tính / vàng / xanh — không dùng đỏ (đỏ dành cho đóng dấu chốt)
export const KIND_META: Record<OpinionKind, { label: string; icon: LucideIcon; chip: string; active: string }> = {
  OPINION: {
    label: 'Ý kiến',
    icon: MessageSquareText,
    chip: 'bg-neutral text-neutral-foreground',
    active: 'bg-foreground text-background border-foreground',
  },
  QUESTION: {
    label: 'Câu hỏi',
    icon: HelpCircle,
    chip: 'bg-due-soon text-due-soon-foreground',
    active: 'bg-due-soon text-due-soon-foreground border-due-soon-foreground/40',
  },
  PROPOSAL: {
    label: 'Đề xuất',
    icon: Lightbulb,
    chip: 'bg-primary-soft text-primary',
    active: 'bg-primary-soft text-primary border-primary/40',
  },
}
