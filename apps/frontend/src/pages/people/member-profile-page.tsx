import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  Mail,
  Pencil,
  Phone,
  Target,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "@/components/empty-state";
import { PageTopbar } from "@/components/layout/topbar-slot";
import { PageContainer } from "@/components/page-header";
import { DeadlineBadge } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/features/auth/use-auth";
import { useMemberProfile, type MemberProfileTask } from "@/features/users/api";
import { useOpenTask } from "@/hooks/use-open-task";
import { PRIORITY_META, STATUS_META, USER_STATUS_LABEL } from "@/lib/constants";
import { fmtDate, fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";

import { MemberEditDialog, RolePill } from "./people-ui";

export function MemberProfilePage() {
  const { id } = useParams();
  const { user: me, isAdmin } = useAuth();
  const { data, isLoading, isError } = useMemberProfile(id);
  const openTask = useOpenTask();
  const [editing, setEditing] = useState(false);

  if (isLoading)
    return (
      <PageContainer>
        <PageTopbar
          crumbs={[
            { label: "Thành viên", to: "/members" },
            { label: "Đang tải…" },
          ]}
        />
        <Skeleton className="h-44 rounded-[10px]" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[10px]" />
          ))}
        </div>
        <Skeleton className="mt-5 h-72 rounded-[10px]" />
      </PageContainer>
    );
  if (isError || !data)
    return (
      <PageContainer>
        <PageTopbar
          crumbs={[
            { label: "Thành viên", to: "/members" },
            { label: "Không tìm thấy" },
          ]}
        />
        <EmptyState
          icon={UserX}
          title="Không tìm thấy thành viên"
          description="Tài khoản có thể đã bị xoá hoặc đường dẫn không đúng."
          action={
            <Button variant="outline" asChild>
              <Link to="/members">Về danh sách thành viên</Link>
            </Button>
          }
        />
      </PageContainer>
    );

  const { user: u, stats, openTasks } = data;
  const isSelf = u.id === me?.id;
  const diff = stats.done30 - stats.donePrev30;
  const projects = [
    ...new Map(openTasks.map((t) => [t.projectId, t])).values(),
  ];

  return (
    <PageContainer>
      <PageTopbar
        crumbs={[{ label: "Thành viên", to: "/members" }, { label: u.name }]}
        actions={
          isSelf ? (
            <Button size="sm" variant="outline" asChild>
              <Link to="/profile">
                <Pencil /> Chỉnh sửa hồ sơ
              </Link>
            </Button>
          ) : isAdmin ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil /> Sửa vai trò & thông tin
            </Button>
          ) : undefined
        }
      />

      {/* Đầu trang hồ sơ */}
      <section className="bg-card shadow-card relative overflow-hidden rounded-[10px] border">
        <div
          className="from-primary-soft h-20 bg-gradient-to-r to-transparent"
          aria-hidden
        />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-7 md:flex-row md:items-end md:gap-5">
          <UserAvatar user={u} className="ring-card -mt-10 size-20 shrink-0 ring-4 [&_[data-slot=avatar-fallback]]:text-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl leading-tight font-extrabold tracking-tight md:text-[28px]">
                {u.name}
              </h1>
              <RolePill role={u.role} />
              {u.status !== "ACTIVE" && (
                <span className="bg-due-soon text-due-soon-foreground inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold">
                  {USER_STATUS_LABEL[u.status]}
                </span>
              )}
            </div>
            <div className="text-text-secondary mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>{u.title || "Chưa cập nhật chức danh"}</span>
              {u.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" strokeWidth={1.8} aria-hidden />{" "}
                  {u.department}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays
                  className="size-4"
                  strokeWidth={1.8}
                  aria-hidden
                />{" "}
                Tham gia từ {fmtDate(u.createdAt, "MM/yyyy")}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-sm md:items-end">
            <a
              href={`mailto:${u.email}`}
              className="hover:text-primary flex items-center gap-2 transition-colors"
            >
              <Mail
                className="text-muted-foreground size-4"
                strokeWidth={1.8}
                aria-hidden
              />
              <span className="truncate">{u.email}</span>
            </a>
            {u.phone && (
              <a
                href={`tel:${u.phone}`}
                className="hover:text-primary flex items-center gap-2 transition-colors"
              >
                <Phone
                  className="text-muted-foreground size-4"
                  strokeWidth={1.8}
                  aria-hidden
                />
                {u.phone}
              </a>
            )}
            {u.lastLoginAt && (
              <span className="text-muted-foreground flex items-center gap-2 text-xs">
                <Clock className="size-3.5" strokeWidth={1.8} aria-hidden />{" "}
                Hoạt động {fromNow(u.lastLoginAt)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Số liệu */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={CheckCircle2}
          label="Hoàn thành 30 ngày"
          value={stats.done30}
          hint={
            <span
              className={cn(
                "flex items-center gap-1",
                diff > 0
                  ? "text-on-time-foreground"
                  : diff < 0
                    ? "text-late-foreground"
                    : "text-muted-foreground",
              )}
            >
              {diff > 0 ? (
                <ArrowUpRight className="size-3.5" />
              ) : diff < 0 ? (
                <ArrowDownRight className="size-3.5" />
              ) : (
                <ArrowRight className="size-3.5" />
              )}
              {diff === 0
                ? "Bằng 30 ngày trước"
                : `${diff > 0 ? "Tăng" : "Giảm"} ${Math.abs(diff)} so với 30 ngày trước`}
            </span>
          }
        />
        <Stat
          icon={Target}
          label="Tỷ lệ đúng hạn"
          value={stats.onTimeRate === null ? "—" : `${stats.onTimeRate}%`}
          valueClass={
            stats.onTimeRate !== null && stats.onTimeRate >= 80
              ? "text-on-time-foreground"
              : undefined
          }
          hint={
            stats.onTime + stats.late
              ? `${stats.onTime} trên ${stats.onTime + stats.late} việc (90 ngày)`
              : "Chưa có việc có hạn hoàn thành"
          }
        />
        <Stat
          icon={CircleDot}
          label="Đang làm"
          value={stats.open}
          hint={`${openTasks.length > 0 ? `${projects.length} dự án` : "Không có việc mở"}`}
        />
        <Stat
          icon={AlertTriangle}
          label="Quá hạn"
          value={stats.overdue}
          valueClass={stats.overdue ? "text-overdue-foreground" : undefined}
          hint={stats.overdue ? "Cần xử lý sớm" : "Không có việc quá hạn"}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Việc đang làm */}
        <section className="bg-card shadow-card rounded-[10px] border">
          <header className="flex items-center justify-between gap-2 border-b px-5 py-4">
            <h2 className="text-[17px] font-bold">Việc đang làm</h2>
            {stats.open > openTasks.length && (
              <span className="text-muted-foreground text-xs">
                Hiển thị {openTasks.length}/{stats.open} việc gần hạn nhất
              </span>
            )}
          </header>
          {openTasks.length ? (
            <ul className="divide-y">
              {openTasks.map((t) => (
                <TaskRow key={t.id} task={t} onOpen={() => openTask(t)} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Không có việc đang mở"
              description="Mọi việc được giao đã hoàn thành."
              className="m-5 border-0"
            />
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="bg-card shadow-card rounded-[10px] border p-5">
            <h2 className="text-[17px] font-bold">Kỹ năng và chuyên môn</h2>
            {u.skills?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-7 items-center rounded-full border px-3 text-[13px] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                Chưa thêm kỹ năng.
              </p>
            )}
            {u.bio && (
              <>
                <h3 className="text-muted-foreground mt-5 text-xs font-semibold tracking-wide uppercase">
                  Giới thiệu
                </h3>
                <p className="text-text-secondary mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                  {u.bio}
                </p>
              </>
            )}
          </section>

          <section className="bg-card shadow-card rounded-[10px] border p-5">
            <h2 className="text-[17px] font-bold">Dự án đang tham gia</h2>
            {projects.length ? (
              <ul className="mt-3 grid gap-1">
                {projects.map((p) => {
                  const count = openTasks.filter(
                    (t) => t.projectId === p.projectId,
                  ).length;
                  return (
                    <li key={p.projectId}>
                      <Link
                        to={`/projects/${p.projectId}`}
                        className="hover:bg-subtle -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
                      >
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
                          style={{ background: p.projectColor }}
                        >
                          {p.projectKey.slice(0, 2)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {p.projectName}
                        </span>
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {count} việc mở
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                Chưa có việc đang mở trong dự án nào.
              </p>
            )}
          </section>
        </div>
      </div>

      {isAdmin && !isSelf && (
        <MemberEditDialog user={u} open={editing} onOpenChange={setEditing} />
      )}
    </PageContainer>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  valueClass,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="bg-card shadow-card rounded-[10px] border p-4">
      <div className="text-text-secondary flex items-center justify-between text-[13px] font-semibold">
        {label}
        <Icon
          className="text-muted-foreground size-4"
          strokeWidth={1.8}
          aria-hidden
        />
      </div>
      <div
        className={cn(
          "num mt-2 text-[32px] leading-none font-extrabold tracking-tight",
          valueClass,
        )}
      >
        {value}
      </div>
      {hint && <div className="text-muted-foreground mt-2 text-xs">{hint}</div>}
    </div>
  );
}

function TaskRow({
  task: t,
  onOpen,
}: {
  task: MemberProfileTask;
  onOpen: () => void;
}) {
  const st = STATUS_META[t.status];
  const pr = PRIORITY_META[t.priority];
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="hover:bg-subtle focus-visible:bg-subtle flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors outline-none"
      >
        <span
          className={cn("size-2 shrink-0 rounded-full", st.dot)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{t.title}</div>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            <span className="font-mono">
              {t.projectKey}-{t.number}
            </span>
            <span>·</span>
            <span className="truncate">{t.projectName}</span>
            <span>·</span>
            <span>{st.label}</span>
            {(t.priority === "URGENT" || t.priority === "HIGH") && (
              <>
                <span>·</span>
                <span className={pr.color}>{pr.label}</span>
              </>
            )}
          </div>
        </div>
        <DeadlineBadge due={t.dueDate} />
      </button>
    </li>
  );
}
