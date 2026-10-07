import { File, FileImage, FileSpreadsheet, FileText, FileType2, PenTool, type LucideIcon } from 'lucide-react'

export type FileKind = 'pdf' | 'image' | 'cad' | 'sheet' | 'doc' | 'other'

// Cùng quy tắc phân loại với backend (attachments.service KIND_SQL)
export function fileKind(fileName: string, mimeType: string): FileKind {
  const name = fileName.toLowerCase()
  if (mimeType === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (/\.(dwg|dxf|rvt|ifc|skp)$/.test(name)) return 'cad'
  if (/\.(xlsx?|csv|ods)$/.test(name)) return 'sheet'
  if (/\.(docx?|odt|pptx?|txt|md)$/.test(name)) return 'doc'
  return 'other'
}

export const fileExt = (fileName: string) => {
  const m = /\.([a-z0-9]{1,5})$/i.exec(fileName)
  return m ? m[1].toUpperCase() : 'FILE'
}

export const KIND_META: Record<FileKind, { label: string; icon: LucideIcon; tile: string; soft: string }> = {
  pdf: {
    label: 'PDF',
    icon: FileText,
    tile: 'from-orange-500/15 to-orange-500/5 text-orange-700 dark:text-orange-300',
    soft: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  cad: {
    label: 'Bản vẽ CAD',
    icon: PenTool,
    tile: 'from-primary/20 to-primary/5 text-primary',
    soft: 'bg-primary-soft text-primary',
  },
  image: {
    label: 'Hình ảnh',
    icon: FileImage,
    tile: 'from-teal-500/15 to-teal-500/5 text-teal-700 dark:text-teal-300',
    soft: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  },
  sheet: {
    label: 'Bảng tính',
    icon: FileSpreadsheet,
    tile: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  doc: {
    label: 'Tài liệu',
    icon: FileType2,
    tile: 'from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-300',
    soft: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  other: {
    label: 'Khác',
    icon: File,
    tile: 'from-slate-500/15 to-slate-500/5 text-slate-600 dark:text-slate-300',
    soft: 'bg-neutral text-neutral-foreground',
  },
}

export const KIND_ORDER: FileKind[] = ['pdf', 'cad', 'image', 'sheet', 'doc', 'other']

export const canPreview = (kind: FileKind) => kind === 'pdf' || kind === 'image'
