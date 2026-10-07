import { BellRing, CalendarClock, CalendarPlus, Check, Copy, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Pill } from '@/components/pill'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { calendarUrl, useCalendarToken, useRegenerateCalendar, useSaveProfile, type ProfilePatch } from '@/features/profile/api'
import { errorMessage } from '@/lib/api'
import type { User } from '@/types/api'
import { SectionCard, ToggleRow } from './parts'

export function NotificationsTab({ user }: { user: User }) {
  const save = useSaveProfile()
  const set = (patch: ProfilePatch) =>
    save.mutate(patch, { onSuccess: () => toast.success('Đã lưu cài đặt thông báo'), onError: (e) => toast.error(errorMessage(e)) })

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="min-w-0 space-y-6">
        <SectionCard
          title="Kênh nhận thông báo"
          icon={<BellRing className="size-[18px]" strokeWidth={1.8} />}
          description="Chọn nơi bạn muốn nhận tin khi được giao việc, được nhắc tên hoặc có cập nhật."
          bodyClassName="pt-1"
        >
          <div className="divide-border divide-y">
            <ToggleRow
              id="nt-web"
              label="Trong web"
              description="Chuông thông báo và trang Thông báo, cập nhật tức thì."
              checked={user.webNotifications}
              onChange={(v) => set({ webNotifications: v })}
            />
            <ToggleRow
              id="nt-email"
              label="Email"
              description={`Gửi tới ${user.email}: nhắc hạn, giao việc, nhắc tên.`}
              checked={user.emailNotifications}
              onChange={(v) => set({ emailNotifications: v })}
            />
            <ToggleRow id="nt-zalo" label="Zalo" description="Nhận nhắc việc qua Zalo OA của công ty." checked={false} disabled badge={<Pill>Sắp có</Pill>} />
          </div>
        </SectionCard>

        <SectionCard
          title="Nhắc trước hạn"
          icon={<CalendarClock className="size-[18px]" strokeWidth={1.8} />}
          description="Nhắc các việc bạn được giao trước khi đến hạn chót."
          bodyClassName="pt-1"
        >
          <div className="divide-border divide-y">
            <ToggleRow id="nt-24" label="Trước hạn 24 giờ" description="Một ngày trước hạn chót." checked={user.remind24h} onChange={(v) => set({ remind24h: v })} />
            <ToggleRow id="nt-2" label="Trước hạn 2 giờ" description="Lời nhắc cuối trước khi quá hạn." checked={user.remind2h} onChange={(v) => set({ remind2h: v })} />
          </div>
          {!user.webNotifications && !user.emailNotifications && (
            <p className="bg-due-soon text-due-soon-foreground mt-2 rounded-md px-3 py-2 text-[13px] font-medium">
              Bạn đang tắt cả thông báo trong web và email nên sẽ không nhận được lời nhắc.
            </p>
          )}
        </SectionCard>
      </div>
      <div className="min-w-0">
        <CalendarCard />
      </div>
    </div>
  )
}

function CalendarCard() {
  const { data, isLoading } = useCalendarToken()
  const regen = useRegenerateCalendar()
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const url = data ? calendarUrl(data.token) : ''

  const copy = () =>
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true)
        toast.success('Đã sao chép đường dẫn lịch')
        setTimeout(() => setCopied(false), 1500)
      },
      () => toast.error('Không sao chép được, hãy chọn và sao chép thủ công'),
    )

  return (
    <SectionCard
      title="Lịch cá nhân (iCal)"
      icon={<CalendarPlus className="size-[18px]" strokeWidth={1.8} />}
      description="Hạn chót các việc của bạn tự hiện trong Google Calendar hoặc Outlook."
    >
      <div className="space-y-1.5">
        <Label htmlFor="ical-url">Đường dẫn đăng ký lịch</Label>
        {isLoading ? (
          <Skeleton className="h-9" />
        ) : (
          <div className="flex gap-2">
            <Input id="ical-url" readOnly value={url} onFocus={(e) => e.target.select()} className="num min-w-0 flex-1 font-mono text-[13px]" />
            <Button type="button" variant="outline" onClick={copy} disabled={!url} aria-label="Sao chép đường dẫn">
              {copied ? <Check /> : <Copy strokeWidth={1.8} />}
              <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
            </Button>
          </div>
        )}
        <p className="text-muted-foreground text-xs">Giữ kín đường dẫn này: ai có nó đều xem được danh sách việc của bạn.</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Guide
          title="Google Calendar"
          steps={['Mở calendar.google.com', 'Bên trái, bấm “+” cạnh “Lịch khác”', 'Chọn “Từ URL”, dán đường dẫn, bấm “Thêm lịch”']}
        />
        <Guide
          title="Outlook"
          steps={['Mở Lịch trong Outlook', 'Chọn “Thêm lịch” → “Đăng ký từ web”', 'Dán đường dẫn, đặt tên rồi bấm “Nhập”']}
        />
      </div>
      <p className="text-muted-foreground mt-3 text-xs">Lịch được ứng dụng lịch tự làm mới định kỳ (thường vài giờ một lần).</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-text-secondary text-[13px]">Lỡ chia sẻ đường dẫn? Tạo đường dẫn mới, đường dẫn cũ sẽ ngừng hoạt động.</p>
        <Button variant="outline" size="sm" onClick={() => setConfirm(true)} disabled={regen.isPending}>
          {regen.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw strokeWidth={1.8} />}
          Tạo đường dẫn mới
        </Button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tạo đường dẫn lịch mới?</AlertDialogTitle>
            <AlertDialogDescription>
              Đường dẫn hiện tại sẽ ngừng hoạt động. Bạn cần đăng ký lại lịch trong Google Calendar hoặc Outlook bằng đường dẫn mới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                regen.mutate(undefined, {
                  onSuccess: () => toast.success('Đã tạo đường dẫn lịch mới'),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Tạo mới
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}

function Guide({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-subtle rounded-lg border p-3.5">
      <div className="text-sm font-semibold">{title}</div>
      <ol className="text-text-secondary mt-2 space-y-1.5 text-[13px]">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="bg-card num grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
