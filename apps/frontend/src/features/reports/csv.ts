import { format } from 'date-fns'

import type { ReportData } from './api'

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const row = (cols: unknown[]) => cols.map(cell).join(',')
const pct = (v: number | null) => (v === null ? '' : `${v}%`)

// Xuất báo cáo ra CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt)
export function reportToCsv(data: ReportData, scopeLabel: string) {
  const lines: string[] = []
  lines.push(row(['Báo cáo hiệu suất', `${data.days} ngày gần nhất`, scopeLabel, `Xuất lúc ${format(new Date(), 'HH:mm dd/MM/yyyy')}`]))
  lines.push('')
  lines.push(row(['TỔNG QUAN']))
  lines.push(row(['Hoàn thành', 'Đúng hạn', 'Trễ hạn', 'Tỉ lệ đúng hạn', 'Quá hạn (đang mở)', 'Đang mở', 'Việc mới tạo']))
  const s = data.summary
  lines.push(row([s.done, s.onTime, s.late, pct(s.rate), s.overdue, s.open, s.created]))
  lines.push('')
  lines.push(row(['THEO THÀNH VIÊN']))
  lines.push(row(['Thành viên', 'Chức danh', 'Hoàn thành', 'Đúng hạn', 'Trễ hạn', 'Tỉ lệ đúng hạn', 'Quá hạn', 'Đang mở', 'Trễ TB (giờ)']))
  for (const m of data.members)
    lines.push(row([m.name, m.title ?? '', m.done, m.onTime, m.late, pct(m.rate), m.overdue, m.open, m.avgLateHours]))
  lines.push('')
  lines.push(row(['THEO DỰ ÁN']))
  lines.push(row(['Dự án', 'Mã', 'Khách hàng', 'Tổng việc', 'Đã xong', 'Tiến độ', 'Tỉ lệ đúng hạn', 'Quá hạn', 'Hạn dự án']))
  for (const p of data.projects)
    lines.push(
      row([
        p.name,
        p.key,
        p.clientName ?? 'Nội bộ',
        p.total,
        p.done,
        `${p.progress}%`,
        pct(p.rate),
        p.overdue,
        p.dueDate ? format(new Date(p.dueDate), 'dd/MM/yyyy') : '',
      ]),
    )
  lines.push('')
  lines.push(row(['THEO TUẦN (12 tuần)']))
  lines.push(row(['Tuần bắt đầu', 'Hoàn thành', 'Đúng hạn / không hạn', 'Trễ hạn']))
  for (const w of data.weekly) lines.push(row([format(new Date(w.week), 'dd/MM/yyyy'), w.done, w.onTime, w.late]))
  lines.push('')
  lines.push(row(['THEO NHÃN']))
  lines.push(row(['Nhãn', 'Tổng việc', 'Quá hạn']))
  for (const l of data.labels) lines.push(row([l.label, l.total, l.overdue]))
  return '﻿' + lines.join('\r\n')
}

export function downloadCsv(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
