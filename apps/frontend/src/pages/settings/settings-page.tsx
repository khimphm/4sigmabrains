import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Building,
  CheckCircle2,
  Clock,
  Database,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Shield,
  Tags,
  Trash2,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { PageTopbar } from "@/components/layout/topbar-slot";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthProviders } from "@/features/auth/api";
import { useSettings, useUpdateSettings } from "@/features/settings/api";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { WorkspaceSettings } from "@/types/api";

type Section = "company" | "labels" | "hours" | "security" | "dataset";

const SECTIONS: {
  id: Section;
  label: string;
  icon: LucideIcon;
  desc: string;
}[] = [
  {
    id: "company",
    label: "Thông tin công ty",
    icon: Building,
    desc: "Tên, liên hệ hiển thị trên email và cổng khách hàng",
  },
  {
    id: "labels",
    label: "Nhãn công việc",
    icon: Tags,
    desc: "Nhãn gợi ý khi tạo công việc",
  },
  {
    id: "hours",
    label: "Giờ làm việc",
    icon: Clock,
    desc: "Dùng cho nhắc hạn và báo cáo",
  },
  {
    id: "security",
    label: "Đăng nhập & bảo mật",
    icon: Shield,
    desc: "Phương thức đăng nhập đang bật",
  },
  {
    id: "dataset",
    label: "Dataset",
    icon: Database,
    desc: "Bộ nhãn cho dữ liệu bản vẽ",
  },
];

const SWATCHES = [
  "#4F7CF5",
  "#1F4FD1",
  "#7C3AED",
  "#DB2777",
  "#B42318",
  "#E08A3C",
  "#B45309",
  "#CA8A04",
  "#16A34A",
  "#38B2A0",
  "#0891B2",
  "#475569",
];

// Thứ tự hiển thị T2..CN (0 = Chủ nhật theo backend)
const DAYS: { v: number; short: string; full: string }[] = [
  { v: 1, short: "T2", full: "Thứ hai" },
  { v: 2, short: "T3", full: "Thứ ba" },
  { v: 3, short: "T4", full: "Thứ tư" },
  { v: 4, short: "T5", full: "Thứ năm" },
  { v: 5, short: "T6", full: "Thứ sáu" },
  { v: 6, short: "T7", full: "Thứ bảy" },
  { v: 0, short: "CN", full: "Chủ nhật" },
];

const KEYS = ["company", "taskLabels", "workHours"] as const;
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const section = (SECTIONS.find((s) => s.id === params.get("s"))?.id ??
    "company") as Section;
  const go = (s: Section) =>
    setParams((p) => (s === "company" ? p.delete("s") : p.set("s", s), p), {
      replace: true,
    });
  const { data, isLoading } = useSettings();
  const save = useUpdateSettings();
  // Bản nháp chỉ tồn tại khi đã sửa; chưa sửa thì hiển thị dữ liệu máy chủ
  const [edits, setEdits] = useState<WorkspaceSettings | null>(null);
  const draft = edits ?? data ?? null;

  const changed = useMemo(
    () => (data && draft ? KEYS.filter((k) => !same(data[k], draft[k])) : []),
    [data, draft],
  );
  const dirty = changed.length > 0;

  // Cảnh báo khi rời trang mà chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const labelError = draft ? validateLabels(draft.taskLabels) : null;
  const hoursError =
    draft && draft.workHours.start >= draft.workHours.end
      ? "Giờ kết thúc phải sau giờ bắt đầu"
      : null;
  const companyError =
    draft && !draft.company.name.trim()
      ? "Tên công ty không được để trống"
      : null;
  const error = labelError || hoursError || companyError;

  const submit = () => {
    if (!draft || !dirty || error) return;
    const patch: Partial<WorkspaceSettings> = {};
    for (const k of changed)
      (patch as Record<string, unknown>)[k] =
        k === "taskLabels"
          ? draft.taskLabels.map((l) => ({ ...l, name: l.name.trim() }))
          : draft[k];
    save.mutate(patch, {
      onSuccess: () => {
        setEdits(null);
        toast.success("Đã lưu cài đặt");
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  const set = <K extends keyof WorkspaceSettings>(
    k: K,
    v: WorkspaceSettings[K],
  ) =>
    setEdits((d) => {
      const base = d ?? data;
      return base ? { ...base, [k]: v } : d;
    });
  const current = SECTIONS.find((s) => s.id === section)!;
  const changedSection = (s: Section) =>
    (s === "company" && changed.includes("company")) ||
    (s === "labels" && changed.includes("taskLabels")) ||
    (s === "hours" && changed.includes("workHours"));

  return (
    <PageContainer>
      <PageTopbar
        crumbs={[{ label: "Cài đặt" }, { label: current.label }]}
        title="Cài đặt"
      />
      <PageHeader
        title="Cài đặt"
        description="Cấu hình chung cho toàn bộ không gian làm việc. Chỉ quản trị viên thấy trang này."
      />

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <nav
          aria-label="Mục cài đặt"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 md:sticky md:top-20 md:mx-0 md:flex-col md:self-start md:px-0"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={section === s.id ? "page" : undefined}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-semibold whitespace-nowrap transition-colors",
                section === s.id
                  ? "bg-primary-soft text-primary"
                  : "text-text-secondary hover:bg-card hover:text-foreground",
              )}
            >
              <s.icon className="size-4" strokeWidth={1.8} aria-hidden />
              <span className="flex-1">{s.label}</span>
              {changedSection(s.id) && (
                <span
                  className="bg-due-soon-foreground size-1.5 rounded-full"
                  title="Có thay đổi chưa lưu"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="min-w-0 pb-24">
          <section className="bg-card shadow-card rounded-[10px] border">
            <header className="border-b px-5 py-4 md:px-6">
              <h2 className="text-xl font-bold">{current.label}</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {current.desc}
              </p>
            </header>
            <div className="p-5 md:p-6">
              {isLoading || !draft ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : section === "company" ? (
                <CompanySection
                  value={draft.company}
                  onChange={(v) => set("company", v)}
                  error={companyError}
                />
              ) : section === "labels" ? (
                <LabelsSection
                  value={draft.taskLabels}
                  onChange={(v) => set("taskLabels", v)}
                  error={labelError}
                />
              ) : section === "hours" ? (
                <HoursSection
                  value={draft.workHours}
                  onChange={(v) => set("workHours", v)}
                  error={hoursError}
                />
              ) : section === "security" ? (
                <SecuritySection />
              ) : (
                <DatasetSection />
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Thanh lưu dính dưới */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 transition-all duration-200 lg:pl-60 motion-reduce:transition-none",
          dirty ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <div className="bg-card shadow-pop pointer-events-auto flex w-full max-w-2xl flex-wrap items-center gap-3 rounded-[10px] border px-4 py-3">
          <span
            className="bg-due-soon-foreground size-2 shrink-0 rounded-full"
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold">Có thay đổi chưa lưu</div>
            <div
              className={cn(
                "truncate text-xs",
                error ? "text-overdue-foreground" : "text-muted-foreground",
              )}
            >
              {error ??
                changed
                  .map(
                    (k) =>
                      ({
                        company: "Thông tin công ty",
                        taskLabels: "Nhãn công việc",
                        workHours: "Giờ làm việc",
                      })[k],
                  )
                  .join(", ")}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            tabIndex={dirty ? 0 : -1}
            onClick={() => setEdits(null)}
            disabled={save.isPending}
          >
            Huỷ thay đổi
          </Button>
          <Button
            size="sm"
            tabIndex={dirty ? 0 : -1}
            onClick={submit}
            disabled={save.isPending || !!error}
          >
            {save.isPending && <Loader2 className="animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

function validateLabels(labels: WorkspaceSettings["taskLabels"]) {
  const names = labels.map((l) => l.name.trim().toLowerCase());
  if (names.some((n) => !n)) return "Tên nhãn không được để trống";
  if (new Set(names).size !== names.length) return "Có nhãn bị trùng tên";
  if (labels.some((l) => !/^#[0-9a-f]{6}$/i.test(l.color)))
    return "Màu nhãn phải là mã hex dạng #RRGGBB";
  return null;
}

function Field({
  label,
  htmlFor,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function CompanySection({
  value,
  onChange,
  error,
}: {
  value: WorkspaceSettings["company"];
  onChange: (v: WorkspaceSettings["company"]) => void;
  error: string | null;
}) {
  const f = (k: keyof WorkspaceSettings["company"]) => ({
    id: `co-${k}`,
    value: value[k],
    onChange: (e: { target: { value: string } }) =>
      onChange({ ...value, [k]: e.target.value }),
  });
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Tên công ty" htmlFor="co-name">
          <Input
            {...f("name")}
            maxLength={120}
            aria-invalid={!!error}
            placeholder="Công ty TNHH 4SigmaBrains"
          />
        </Field>
        <Field
          label="Tên viết tắt"
          htmlFor="co-shortName"
          hint="Hiện trên logo, tối đa 20 ký tự"
        >
          <Input {...f("shortName")} maxLength={20} placeholder="4SB" />
        </Field>
      </div>
      <Field label="Địa chỉ" htmlFor="co-address">
        <Input
          {...f("address")}
          maxLength={300}
          placeholder="Số nhà, đường, quận, thành phố"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Số điện thoại" htmlFor="co-phone">
          <Input
            {...f("phone")}
            type="tel"
            maxLength={40}
            placeholder="028 1234 5678"
          />
        </Field>
        <Field label="Email liên hệ" htmlFor="co-email">
          <Input
            {...f("email")}
            type="email"
            maxLength={120}
            placeholder="lienhe@congty.vn"
          />
        </Field>
      </div>
      <Field label="Website" htmlFor="co-website">
        <Input
          {...f("website")}
          maxLength={200}
          placeholder="https://congty.vn"
        />
      </Field>
      {error && <p className="text-overdue-foreground text-sm">{error}</p>}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (c: string) => void;
  label: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Chọn màu cho ${label}`}
          className="focus-visible:ring-ring/50 grid size-9 shrink-0 cursor-pointer place-items-center rounded-md border transition-shadow outline-none hover:shadow-sm focus-visible:ring-[3px]"
        >
          <span className="size-5 rounded" style={{ background: value }} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Màu ${c}`}
              aria-pressed={c.toLowerCase() === value.toLowerCase()}
              onClick={() => onChange(c)}
              className={cn(
                "size-7 cursor-pointer rounded-md transition-transform hover:scale-110 motion-reduce:transform-none",
                c.toLowerCase() === value.toLowerCase() &&
                  "ring-foreground ring-offset-popover ring-2 ring-offset-2",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Label
            htmlFor={`hex-${label}`}
            className="text-muted-foreground text-xs"
          >
            Mã màu
          </Label>
          <Input
            id={`hex-${label}`}
            key={value}
            defaultValue={value}
            onChange={(e) => {
              if (/^#[0-9a-f]{6}$/i.test(e.target.value))
                onChange(e.target.value.toUpperCase());
            }}
            className="h-8 font-mono text-xs"
            maxLength={7}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LabelsSection({
  value,
  onChange,
  error,
}: {
  value: WorkspaceSettings["taskLabels"];
  onChange: (v: WorkspaceSettings["taskLabels"]) => void;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const update = (
    i: number,
    patch: Partial<WorkspaceSettings["taskLabels"][number]>,
  ) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (value.some((l) => l.name.trim().toLowerCase() === n.toLowerCase())) {
      toast.error("Nhãn này đã có");
      return;
    }
    onChange([
      ...value,
      { name: n, color: SWATCHES[value.length % SWATCHES.length] },
    ]);
    setName("");
  };
  return (
    <div className="grid gap-5">
      <p className="text-text-secondary text-sm">
        Nhãn hiện theo thứ tự này khi tạo hoặc lọc công việc. Đổi tên nhãn không
        cập nhật các công việc đã gắn nhãn cũ.
      </p>
      <ul className="divide-y rounded-lg border">
        {value.map((l, i) => (
          <li key={i} className="flex items-center gap-2 px-3 py-2">
            <ColorPicker
              value={l.color}
              onChange={(c) => update(i, { color: c })}
              label={l.name || `nhãn ${i + 1}`}
            />
            <Input
              value={l.name}
              onChange={(e) => update(i, { name: e.target.value })}
              maxLength={40}
              aria-label={`Tên nhãn ${i + 1}`}
              aria-invalid={!l.name.trim()}
              className="h-9 min-w-0 flex-1"
            />
            <span
              className="hidden h-6 w-28 shrink-0 items-center justify-center truncate rounded-md px-2 text-xs font-semibold sm:inline-flex"
              style={{ background: `${l.color}1F`, color: l.color }}
              aria-hidden
            >
              {l.name || "Xem trước"}
            </span>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Lên trên"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Xuống dưới"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Xoá nhãn ${l.name}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
        {!value.length && (
          <li className="text-muted-foreground px-3 py-6 text-center text-sm">
            Chưa có nhãn nào
          </li>
        )}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Tên nhãn mới, ví dụ: Hồ sơ thầu"
          aria-label="Tên nhãn mới"
          className="max-w-sm"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!name.trim() || value.length >= 40}
        >
          <Plus /> Thêm nhãn
        </Button>
      </form>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{value.length}/40 nhãn</span>
        {error && <span className="text-overdue-foreground">{error}</span>}
      </div>
    </div>
  );
}

function HoursSection({
  value,
  onChange,
  error,
}: {
  value: WorkspaceSettings["workHours"];
  onChange: (v: WorkspaceSettings["workHours"]) => void;
  error: string | null;
}) {
  const toggle = (d: number) =>
    onChange({
      ...value,
      workDays: value.workDays.includes(d)
        ? value.workDays.filter((x) => x !== d)
        : [...value.workDays, d].sort(),
    });
  const [sh, sm] = value.start.split(":").map(Number);
  const [eh, em] = value.end.split(":").map(Number);
  const hours = Math.max(0, eh * 60 + em - (sh * 60 + sm)) / 60;
  return (
    <div className="grid gap-6">
      <div className="grid max-w-md grid-cols-2 gap-4">
        <Field label="Bắt đầu" htmlFor="wh-start">
          <Input
            id="wh-start"
            type="time"
            value={value.start}
            onChange={(e) =>
              e.target.value && onChange({ ...value, start: e.target.value })
            }
          />
        </Field>
        <Field label="Kết thúc" htmlFor="wh-end">
          <Input
            id="wh-end"
            type="time"
            value={value.end}
            onChange={(e) =>
              e.target.value && onChange({ ...value, end: e.target.value })
            }
            aria-invalid={!!error}
          />
        </Field>
      </div>
      <div className="grid gap-2">
        <span className="text-[13px] font-semibold" id="wd-label">
          Ngày làm việc
        </span>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="wd-label"
        >
          {DAYS.map((d) => {
            const on = value.workDays.includes(d.v);
            return (
              <button
                key={d.v}
                type="button"
                aria-pressed={on}
                aria-label={d.full}
                title={d.full}
                onClick={() => toggle(d.v)}
                className={cn(
                  "focus-visible:ring-ring/50 h-10 w-12 cursor-pointer rounded-md border text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px]",
                  on
                    ? "border-primary bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-subtle hover:text-foreground",
                )}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-subtle text-text-secondary flex flex-wrap gap-x-6 gap-y-1 rounded-lg border px-4 py-3 text-sm">
        <span>
          <span className="num text-foreground font-bold">
            {hours.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
          </span>{" "}
          giờ / ngày
        </span>
        <span>
          <span className="num text-foreground font-bold">
            {value.workDays.length}
          </span>{" "}
          ngày / tuần
        </span>
        <span>
          <span className="num text-foreground font-bold">
            {(hours * value.workDays.length).toLocaleString("vi-VN", {
              maximumFractionDigits: 1,
            })}
          </span>{" "}
          giờ / tuần
        </span>
      </div>
      {error && <p className="text-overdue-foreground text-sm">{error}</p>}
      <p className="text-muted-foreground text-xs">
        Nhắc hạn trước 24 giờ và 2 giờ vẫn gửi theo giờ thực; giờ làm việc dùng
        để tính báo cáo và lịch nhắc tổng hợp.
      </p>
    </div>
  );
}

function SecuritySection() {
  const { data, isLoading } = useAuthProviders();
  if (isLoading || !data) return <Skeleton className="h-64" />;
  const rows: { label: string; on: boolean; desc: string; env?: string }[] = [
    {
      label: "Email và mật khẩu",
      on: data.password,
      desc: "Luôn bật. Thành viên có thể bật xác thực 2 lớp trong hồ sơ.",
    },
    {
      label: "Google",
      on: data.google,
      desc: "Đăng nhập bằng tài khoản Google Workspace.",
      env: "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET",
    },
    {
      label: "Microsoft",
      on: data.microsoft,
      desc: "Đăng nhập bằng Microsoft 365 / Entra ID.",
      env: "MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT",
    },
    {
      label: "GitHub",
      on: data.github,
      desc: "Đăng nhập bằng tài khoản GitHub.",
      env: "GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET",
    },
    {
      label: "Gửi email (SMTP)",
      on: data.emailEnabled,
      desc: data.emailEnabled
        ? "Email mời, nhắc hạn và đặt lại mật khẩu được gửi tự động."
        : "Chưa cấu hình: link mời sẽ hiện để quản trị viên tự gửi.",
      env: "SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM",
    },
  ];
  return (
    <div className="grid gap-5">
      <ul className="divide-y rounded-lg border">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex flex-wrap items-start gap-3 px-4 py-3.5"
          >
            <KeyRound
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              strokeWidth={1.8}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{r.label}</div>
              <div className="text-muted-foreground mt-0.5 text-xs">
                {r.desc}
              </div>
              {r.env && !r.on && (
                <div className="mt-1.5 text-xs">
                  <span className="text-muted-foreground">
                    Biến môi trường:{" "}
                  </span>
                  <code className="bg-subtle rounded border px-1.5 py-0.5 font-mono text-[11px] break-all">
                    {r.env}
                  </code>
                </div>
              )}
            </div>
            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold",
                r.on
                  ? "bg-on-time text-on-time-foreground"
                  : "bg-neutral text-neutral-foreground",
              )}
            >
              {r.on ? (
                <CheckCircle2 className="size-3.5" aria-hidden />
              ) : (
                <XCircle className="size-3.5" aria-hidden />
              )}
              {r.on ? "Đang bật" : "Chưa cấu hình"}
            </span>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border px-4 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Mail
            className="text-muted-foreground size-4"
            strokeWidth={1.8}
            aria-hidden
          />{" "}
          Miền email được phép đăng ký
        </div>
        {data.allowedDomains.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.allowedDomains.map((d) => (
              <span
                key={d}
                className="bg-primary-soft text-primary inline-flex h-6 items-center rounded-md px-2 font-mono text-xs font-semibold"
              >
                @{d}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-1 text-xs">
            Không giới hạn — mọi email đều đăng ký được (vẫn cần quản trị viên
            duyệt).
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          Đặt bằng biến{" "}
          <code className="bg-subtle rounded border px-1 font-mono text-[11px]">
            ALLOWED_EMAIL_DOMAINS
          </code>{" "}
          (phân cách bằng dấu phẩy). Tài khoản khách hàng được mời không bị giới
          hạn miền.
        </p>
      </div>
      <p className="text-muted-foreground text-xs">
        Các thiết lập này đọc từ cấu hình máy chủ (file .env); sau khi đổi cần
        khởi động lại backend.
      </p>
    </div>
  );
}

function DatasetSection() {
  return (
    <div className="grid gap-4">
      <p className="text-text-secondary text-sm">
        Bộ nhãn lỗi bản vẽ (loại lỗi, màu khung chú thích) và quy trình duyệt dữ
        liệu được quản lý ngay trong trang Dataset bản vẽ.
      </p>
      <Link
        to="/dataset"
        className="hover:border-primary/40 group flex items-center gap-4 rounded-lg border p-4 transition-colors"
      >
        <span className="bg-primary-soft text-primary grid size-10 shrink-0 place-items-center rounded-lg">
          <Database className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Mở Dataset bản vẽ</div>
          <div className="text-muted-foreground text-xs">
            Quản lý bộ nhãn, bản vẽ và tiến độ gán nhãn
          </div>
        </div>
        <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
