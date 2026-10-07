import { useId } from 'react'

import { fmtDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// Con dấu đỏ kiểu mộc cao su: vành kép, chữ chạy vòng, "ĐÃ CHỐT" + ngày ở giữa, xoay nhẹ.
export function SealStamp({ date, className, size = 132 }: { date?: string | null; className?: string; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const ring = `seal-ring-${uid}`
  const rough = `seal-rough-${uid}`
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      role="img"
      aria-label={`Đã chốt${date ? ` ngày ${fmtDate(date)}` : ''}`}
      className={cn('text-seal -rotate-12 select-none', className)}
    >
      <defs>
        <path id={ring} d="M70,70 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" />
        {/* Vân mực loang lổ cho cảm giác con dấu thật */}
        <filter id={rough} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${rough})`} fill="none" stroke="currentColor">
        <circle cx="70" cy="70" r="66" strokeWidth="4" />
        <circle cx="70" cy="70" r="59" strokeWidth="1.5" />
        <circle cx="70" cy="70" r="38" strokeWidth="1.5" />
        <text fill="currentColor" stroke="none" fontSize="10.5" fontWeight="700" letterSpacing="2.4">
          <textPath href={`#${ring}`} startOffset="0">
            4SIGMABRAINS ★ PHÂN TÍCH VÀ CHỐT ★
          </textPath>
        </text>
        <rect x="14" y="56" width="112" height="28" rx="3" fill="var(--card)" stroke="currentColor" strokeWidth="2.5" />
        <text
          x="70"
          y="76"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize="19"
          fontWeight="800"
          letterSpacing="1"
        >
          ĐÃ CHỐT
        </text>
        {date && (
          <text x="70" y="100" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10" fontWeight="700" letterSpacing="0.5">
            {fmtDate(date, 'dd.MM.yyyy')}
          </text>
        )}
        <text x="70" y="47" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="700">
          ★
        </text>
      </g>
    </svg>
  )
}

// Biểu tượng con dấu nhỏ dùng trong danh sách chủ đề
export function SealMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn('text-seal size-4 -rotate-12', className)} aria-hidden>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="4.6" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M5.6 8.2l1.6 1.5 3.2-3.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
