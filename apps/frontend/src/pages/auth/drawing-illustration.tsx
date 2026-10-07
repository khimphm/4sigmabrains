import { ScanSearch } from 'lucide-react'

// Minh hoạ bản vẽ kỹ thuật: lưới blueprint, mặt bằng, khung chú thích cam và callout AI.
const LINE = '#7FA2FF'

function Tag({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} className="fill-annotation" />
      <text x={x} y={y + 3.6} textAnchor="middle" fontSize="10.5" fontWeight={800} fill="#111A24">
        {n}
      </text>
    </g>
  )
}

function Label({ x, y, w, text }: { x: number; y: number; w: number; text: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={24} rx={4} className="fill-annotation" />
      <text x={x + 10} y={y + 15.5} fontSize="11" fontWeight={700} fill="#111A24">
        {text}
      </text>
    </g>
  )
}

function Axis({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="none" stroke={LINE} strokeOpacity={0.55} />
      <text x={x} y={y + 3.8} textAnchor="middle" fontSize="10" fontWeight={600} fill={LINE} fillOpacity={0.8}>
        {label}
      </text>
    </g>
  )
}

export function DrawingIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .fsb-scan { animation: fsb-scan 5.5s cubic-bezier(.45,0,.55,1) infinite; }
          .fsb-dash { animation: fsb-dash 1.6s linear infinite; }
          .fsb-pop { animation: fsb-pop .6s .4s cubic-bezier(.2,.8,.2,1) both; }
        }
        @keyframes fsb-scan { 0% { transform: translateY(40px); opacity: 0 } 10%,85% { opacity: 1 } 100% { transform: translateY(300px); opacity: 0 } }
        @keyframes fsb-dash { to { stroke-dashoffset: -16 } }
        @keyframes fsb-pop { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }
      `}</style>

      <div className="absolute -top-3 right-0 flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60 backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-[#38B2A0]" />
        KT-03 · Mặt bằng tầng 2 · Rev B
      </div>

      <svg viewBox="0 0 520 350" className="h-auto w-full" role="img" aria-label="Bản vẽ mặt bằng với hai vị trí được AI đánh dấu cần kiểm tra">
        <defs>
          <linearGradient id="fsb-scan-grad" x1="0" x2="1">
            <stop offset="0" stopColor={LINE} stopOpacity="0" />
            <stop offset=".5" stopColor={LINE} stopOpacity=".9" />
            <stop offset="1" stopColor={LINE} stopOpacity="0" />
          </linearGradient>
          <pattern id="fsb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={LINE} strokeOpacity=".25" />
          </pattern>
        </defs>

        {/* Kích thước tổng phía trên */}
        <g stroke={LINE} strokeOpacity=".7" strokeWidth="1.2">
          <line x1="40" y1="34" x2="430" y2="34" />
          <line x1="40" y1="26" x2="40" y2="42" />
          <line x1="430" y1="26" x2="430" y2="42" />
          <line x1="200" y1="30" x2="200" y2="38" />
          <line x1="36" y1="38" x2="44" y2="30" />
          <line x1="426" y1="38" x2="434" y2="30" />
        </g>
        <text x="120" y="26" textAnchor="middle" fontSize="10" fill={LINE} fillOpacity=".75" className="num">4 800</text>
        <text x="315" y="26" textAnchor="middle" fontSize="10" fill={LINE} fillOpacity=".75" className="num">7 200</text>

        {/* Trục định vị */}
        <g stroke={LINE} strokeOpacity=".3" strokeDasharray="6 4 1 4">
          <line x1="40" y1="300" x2="40" y2="322" />
          <line x1="200" y1="190" x2="200" y2="322" />
          <line x1="370" y1="115" x2="370" y2="322" />
        </g>
        <Axis x={40} y={333} label="A" />
        <Axis x={200} y={333} label="B" />
        <Axis x={370} y={333} label="C" />

        {/* Tường bao mặt bằng */}
        <path d="M40 70H370V115H430V300H40Z" fill="none" stroke={LINE} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M46 76H364V121H424V294H46Z" fill="none" stroke={LINE} strokeOpacity=".35" strokeWidth="1" />
        {/* Vách ngăn + cửa */}
        <path d="M200 70V150M200 186V190H40" fill="none" stroke={LINE} strokeWidth="1.6" />
        <path d="M200 150A36 36 0 0 1 236 186" fill="none" stroke={LINE} strokeOpacity=".5" strokeDasharray="3 3" />
        <line x1="200" y1="150" x2="236" y2="150" stroke={LINE} strokeOpacity=".5" />
        {/* Khu vệ sinh gạch chéo */}
        <rect x="46" y="196" width="88" height="98" fill="url(#fsb-hatch)" />
        <line x1="134" y1="190" x2="134" y2="300" stroke={LINE} strokeWidth="1.2" />
        {/* Cột / thiết bị */}
        <circle cx="120" cy="130" r="28" fill="none" stroke={LINE} strokeWidth="1.4" />
        <circle cx="120" cy="130" r="14" fill="none" stroke={LINE} strokeWidth="1.4" />
        <path d="M120 96V164M86 130H154" stroke={LINE} strokeOpacity=".3" strokeDasharray="3 3" />
        <circle cx="300" cy="172" r="18" fill="none" stroke={LINE} strokeWidth="1.4" />
        <rect x="240" y="236" width="110" height="40" rx="3" fill="none" stroke={LINE} strokeOpacity=".7" />
        <line x1="295" y1="236" x2="295" y2="276" stroke={LINE} strokeOpacity=".4" />
        {/* Kích thước bên phải */}
        <g stroke={LINE} strokeOpacity=".7" strokeWidth="1.2">
          <line x1="462" y1="115" x2="462" y2="300" />
          <line x1="454" y1="115" x2="470" y2="115" />
          <line x1="454" y1="300" x2="470" y2="300" />
        </g>

        {/* Vết quét AI */}
        <g className="fsb-scan">
          <rect x="30" y="0" width="410" height="1.5" fill="url(#fsb-scan-grad)" />
          <rect x="30" y="-18" width="410" height="18" fill={LINE} fillOpacity=".05" />
        </g>

        {/* Chú thích 1: ký hiệu chưa rõ */}
        <rect x="266" y="138" width="68" height="68" rx="3" fill="#F0813F" fillOpacity=".08" className="fsb-dash stroke-annotation" strokeWidth="1.8" strokeDasharray="6 4" />
        <Tag x={266} y={138} n={1} />
        <line x1="290" y1="206" x2="262" y2="214" className="stroke-annotation" strokeWidth="1.2" />
        <Label x={150} y={204} w={112} text="Ký hiệu chưa rõ" />

        {/* Chú thích 2: thiếu kích thước */}
        <rect x="346" y="50" width="104" height="82" rx="3" fill="#F0813F" fillOpacity=".08" className="fsb-dash stroke-annotation" strokeWidth="1.8" strokeDasharray="6 4" />
        <Tag x={450} y={50} n={2} />
        <Label x={398} y={140} w={116} text="Thiếu kích thước" />
      </svg>

      <div className="fsb-pop absolute -bottom-6 left-0 w-[250px] rounded-[10px] border border-white/10 bg-[#0B121A]/85 p-3.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md sm:-left-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary/25 text-[#9DB6FF]">
            <ScanSearch className="size-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white">AI phát hiện 2 lỗi</div>
            <div className="text-[11px] text-white/50">Đã quét 1 trang · 3 giây</div>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 text-[12px]">
          <li className="flex items-center gap-2 text-white/75">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-annotation text-[10px] font-bold text-[#111A24]">1</span>
            Ký hiệu chưa rõ · trục B–C
          </li>
          <li className="flex items-center gap-2 text-white/75">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-annotation text-[10px] font-bold text-[#111A24]">2</span>
            Thiếu kích thước · trục C
          </li>
        </ul>
      </div>
    </div>
  )
}
