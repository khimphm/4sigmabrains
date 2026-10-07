import {
  Building2,
  Clock,
  FolderKanban,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  Unlock,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PageTopbar } from "@/components/layout/topbar-slot";
import { PageContainer } from "@/components/page-header";
import { DeadlineBadge } from "@/components/pill";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/features/auth/use-auth";
import { useClient, useDeleteClient } from "@/features/clients/api";
import { useUpdateMember } from "@/features/users/api";
import { errorMessage } from "@/lib/api";
import { PROJECT_STATUS_META, USER_STATUS_LABEL } from "@/lib/constants";
import { fromNow, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/types/api";

import { DeleteClientDialog } from "./clients-page";
import { ClientFormDialog, InviteDialog } from "./people-ui";

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const { data: c, isLoading, isError } = useClient(id);
  const remove = useDeleteClient();
  const update = useUpdateMember();
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading)
    return (
      <PageContainer>
        <PageTopbar
          crumbs={[
            { label: "Khách hàng", to: "/clients" },
            { label: "Đang tải…" },
          ]}
        />
        <Skeleton className="h-28 rounded-[10px]" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-80 rounded-[10px]" />
          <Skeleton className="h-80 rounded-[10px]" />
        </div>
      </PageContainer>
    );
  if (isError || !c)
    return (
      <PageContainer>
        <PageTopbar
          crumbs={[
            { label: "Khách hàng", to: "/clients" },
            { label: "Không tìm thấy" },
          ]}
        />
        <EmptyState
          icon={Building2}
          title="Không tìm thấy khách hàng"
          action={
            <Button variant="outline" asChild>
              <Link to="/clients">Về danh sách khách hàng</Link>
            </Button>
          }
        />
      </PageContainer>
    );

  const active = c.projects.filter((p) => p.status === "ACTIVE").length;
  const setStatus = (u: User, status: User["status"]) =>
    update.mutate(
      { id: u.id, status },
      {
        onSuccess: () =>
          toast.success(
            status === "DISABLED"
              ? `Đã khoá ${u.name}`
              : `Đã mở khoá ${u.name}`,
          ),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  return (
    <PageContainer>
      <PageTopbar
        crumbs={[{ label: "Khách hàng", to: "/clients" }, { label: c.name }]}
        actions={
          isManager && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil /> <span className="hidden sm:inline">Sửa thông tin</span>
            </Button>
          )
        }
      />

      <section className="mb-5 flex flex-wrap items-center gap-4">
        <span className="bg-primary-soft text-primary grid size-14 shrink-0 place-items-center rounded-xl text-lg font-extrabold">
          {initials(c.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight md:text-[28px]">
            {c.name}
          </h1>
          <p className="text-text-secondary mt-1 text-[15px]">
            {c.projects.length} dự án · {active} đang chạy · {c.accounts.length}{" "}
            tài khoản cổng khách hàng
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setDeleting(true)}
          >
            <Trash2 /> Xoá
          </Button>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Dự án */}
          <section className="bg-card shadow-card rounded-[10px] border">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-[17px] font-bold">Dự án</h2>
              <span className="text-muted-foreground text-xs">
                {c.projects.length} dự án
              </span>
            </header>
            {c.projects.length ? (
              <ul className="divide-y">
                {c.projects.map((p) => {
                  const pct = p.total
                    ? Math.round((p.done / p.total) * 100)
                    : 0;
                  const meta = PROJECT_STATUS_META[p.status];
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/projects/${p.id}`}
                        className="hover:bg-subtle flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors"
                      >
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                          style={{ background: p.color }}
                        >
                          {p.key.slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1 basis-40">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {p.name}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                                meta.badge,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 font-mono text-xs">
                            {p.key}
                          </div>
                        </div>
                        <div className="flex w-full items-center gap-3 sm:w-56">
                          <Progress
                            value={pct}
                            className="h-1.5"
                            aria-label={`Tiến độ ${pct}%`}
                          />
                          <span className="num w-20 shrink-0 text-right text-xs font-semibold">
                            {pct}%{" "}
                            <span className="text-muted-foreground font-normal">
                              ({p.done}/{p.total})
                            </span>
                          </span>
                        </div>
                        {p.dueDate &&
                          p.status !== "COMPLETED" &&
                          p.status !== "ARCHIVED" && (
                            <DeadlineBadge due={p.dueDate} />
                          )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="Chưa có dự án"
                description="Gắn khách hàng này khi tạo hoặc sửa dự án."
                className="m-5"
              />
            )}
          </section>

          {/* Tài khoản cổng khách hàng */}
          <section className="bg-card shadow-card rounded-[10px] border">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
              <div>
                <h2 className="text-[17px] font-bold">
                  Tài khoản cổng khách hàng
                </h2>
                <p className="text-muted-foreground text-xs">
                  Chỉ xem tiến độ và file được chia sẻ, không thấy trao đổi nội
                  bộ.
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInviting(true)}
                >
                  <UserPlus /> Mời tài khoản
                </Button>
              )}
            </header>
            {c.accounts.length ? (
              <ul className="divide-y">
                {c.accounts.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <UserAvatar user={u} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {u.name}
                        </span>
                        {u.status !== "ACTIVE" && (
                          <span className="bg-neutral text-neutral-foreground rounded px-1.5 py-0.5 text-[11px] font-semibold">
                            {USER_STATUS_LABEL[u.status]}
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {u.email}
                      </div>
                    </div>
                    <span className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:flex">
                      <Clock
                        className="size-3.5"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                      {u.lastLoginAt
                        ? fromNow(u.lastLoginAt)
                        : "Chưa đăng nhập"}
                    </span>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Thao tác với ${u.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {u.status === "DISABLED" ? (
                            <DropdownMenuItem
                              onSelect={() => setStatus(u, "ACTIVE")}
                            >
                              <Unlock /> Mở khoá tài khoản
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setStatus(u, "DISABLED")}
                            >
                              <Lock /> Khoá tài khoản
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={UserRound}
                title="Chưa có tài khoản nào"
                description="Mời đại diện chủ đầu tư để họ tự theo dõi tiến độ."
                className="m-5"
                action={
                  isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInviting(true)}
                    >
                      <UserPlus /> Mời tài khoản
                    </Button>
                  )
                }
              />
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="bg-card shadow-card rounded-[10px] border p-5">
            <h2 className="text-[17px] font-bold">Thông tin liên hệ</h2>
            <dl className="mt-3 grid gap-3 text-sm">
              <InfoRow
                icon={UserRound}
                label="Người liên hệ"
                value={c.contactName}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={c.email}
                href={c.email ? `mailto:${c.email}` : undefined}
              />
              <InfoRow
                icon={Phone}
                label="Điện thoại"
                value={c.phone}
                href={c.phone ? `tel:${c.phone}` : undefined}
              />
              <InfoRow icon={MapPin} label="Địa chỉ" value={c.address} />
            </dl>
          </section>
          <section className="bg-card shadow-card rounded-[10px] border p-5">
            <h2 className="flex items-center gap-2 text-[17px] font-bold">
              <StickyNote
                className="text-muted-foreground size-4"
                strokeWidth={1.8}
                aria-hidden
              />{" "}
              Ghi chú
            </h2>
            {c.notes ? (
              <p className="text-text-secondary mt-2 text-sm leading-relaxed whitespace-pre-line">
                {c.notes}
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                Chưa có ghi chú.{" "}
                {isManager && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-primary cursor-pointer hover:underline"
                  >
                    Thêm ghi chú
                  </button>
                )}
              </p>
            )}
          </section>
        </aside>
      </div>

      <ClientFormDialog client={c} open={editing} onOpenChange={setEditing} />
      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        presetRole="CLIENT"
        presetClientId={c.id}
      />
      <DeleteClientDialog
        client={deleting ? c : null}
        onClose={() => setDeleting(false)}
        onConfirm={(x) =>
          remove.mutate(x.id, {
            onSuccess: () => {
              toast.success(`Đã xoá ${x.name}`);
              navigate("/clients");
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </PageContainer>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon
        className="text-muted-foreground mt-0.5 size-4 shrink-0"
        strokeWidth={1.8}
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="mt-0.5 break-words">
          {value ? (
            href ? (
              <a href={href} className="hover:text-primary transition-colors">
                {value}
              </a>
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">Chưa có</span>
          )}
        </dd>
      </div>
    </div>
  );
}
