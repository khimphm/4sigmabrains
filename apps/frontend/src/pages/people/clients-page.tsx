import {
  Building2,
  FolderKanban,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PageTopbar } from "@/components/layout/topbar-slot";
import { PageContainer, PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/use-auth";
import {
  useClients,
  useDeleteClient,
  type ClientSummary,
} from "@/features/clients/api";
import { errorMessage } from "@/lib/api";
import { initials } from "@/lib/format";

import { ClientFormDialog } from "./people-ui";

export function ClientsPage() {
  const { isAdmin, isManager } = useAuth();
  const { data: clients = [], isLoading } = useClients();
  const remove = useDeleteClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{
    open: boolean;
    client: ClientSummary | null;
  }>({ open: false, client: null });
  const [deleting, setDeleting] = useState<ClientSummary | null>(null);

  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const shown = clients.filter(
    (c) =>
      !q.trim() ||
      norm(
        [c.name, c.contactName, c.email, c.phone].filter(Boolean).join(" "),
      ).includes(norm(q.trim())),
  );
  const totalActive = clients.reduce((s, c) => s + c.activeProjectCount, 0);

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: "Khách hàng" }]}
        actions={
          isManager && (
            <Button
              size="sm"
              onClick={() => setForm({ open: true, client: null })}
            >
              <Plus /> <span className="hidden sm:inline">Thêm khách hàng</span>
            </Button>
          )
        }
      />
      <PageHeader
        title="Khách hàng"
        description={
          isLoading
            ? "Đang tải…"
            : `${clients.length} chủ đầu tư · ${totalActive} dự án đang chạy`
        }
      />

      <div className="relative mb-5 w-full sm:w-80">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          strokeWidth={1.8}
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, người liên hệ…"
          aria-label="Tìm khách hàng"
          className="bg-card pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-[10px]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        q ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy khách hàng"
            description="Thử từ khoá khác."
          />
        ) : (
          <EmptyState
            icon={Building2}
            title="Chưa có khách hàng nào"
            description="Thêm chủ đầu tư để gắn vào dự án và mời họ theo dõi tiến độ."
            action={
              isManager && (
                <Button
                  variant="outline"
                  onClick={() => setForm({ open: true, client: null })}
                >
                  <Plus /> Thêm khách hàng
                </Button>
              )
            }
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => (
            <div
              key={c.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/clients/${c.id}`)}
              onKeyDown={(e) =>
                e.key === "Enter" && navigate(`/clients/${c.id}`)
              }
              className="bg-card shadow-card hover:border-primary/40 focus-visible:ring-ring/50 group flex cursor-pointer flex-col rounded-[10px] border p-5 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] motion-reduce:transform-none"
            >
              <div className="flex items-start gap-3">
                <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-lg text-sm font-bold">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="group-hover:text-primary line-clamp-2 text-[15px] leading-snug font-bold transition-colors">
                    {c.name}
                  </h3>
                  {c.contactName && (
                    <p className="text-text-secondary mt-0.5 flex items-center gap-1.5 truncate text-[13px]">
                      <UserRound
                        className="size-3.5 shrink-0"
                        strokeWidth={1.8}
                        aria-hidden
                      />{" "}
                      {c.contactName}
                    </p>
                  )}
                </div>
                {isManager && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="-mt-1 -mr-2"
                        aria-label={`Thao tác với ${c.name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onSelect={() => setForm({ open: true, client: c })}
                      >
                        <Pencil /> Sửa thông tin
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(c)}
                          >
                            <Trash2 /> Xoá khách hàng
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="bg-subtle mt-4 grid grid-cols-3 divide-x rounded-lg border text-center">
                {(
                  [
                    ["Dự án", c.projectCount, FolderKanban],
                    ["Đang chạy", c.activeProjectCount, FolderKanban],
                    ["Tài khoản", c.accountCount, Users],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="px-2 py-2.5">
                    <div className="num text-lg leading-none font-extrabold">
                      {value}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-text-secondary mt-4 grid gap-1.5 text-[13px]">
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary flex items-center gap-2 truncate transition-colors"
                  >
                    <Mail
                      className="text-muted-foreground size-3.5 shrink-0"
                      strokeWidth={1.8}
                      aria-hidden
                    />{" "}
                    <span className="truncate">{c.email}</span>
                  </a>
                ) : null}
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary flex items-center gap-2 transition-colors"
                  >
                    <Phone
                      className="text-muted-foreground size-3.5 shrink-0"
                      strokeWidth={1.8}
                      aria-hidden
                    />{" "}
                    {c.phone}
                  </a>
                ) : null}
                {!c.email && !c.phone && (
                  <span className="text-muted-foreground italic">
                    Chưa có thông tin liên hệ
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormDialog
        open={form.open}
        client={form.client}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        onSaved={(id) => !form.client && navigate(`/clients/${id}`)}
      />
      <DeleteClientDialog
        client={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(c) =>
          remove.mutate(c.id, {
            onSuccess: () => toast.success(`Đã xoá ${c.name}`),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
      <p className="text-muted-foreground mt-6 text-xs">
        Tài khoản cổng khách hàng được quản lý trong{" "}
        <Link
          to="/members?tab=clients"
          className="text-primary hover:underline"
        >
          Thành viên › Tài khoản khách hàng
        </Link>
        .
      </p>
    </PageContainer>
  );
}

export function DeleteClientDialog({
  client,
  onClose,
  onConfirm,
}: {
  client: ClientSummary | { id: string; name: string } | null;
  onClose: () => void;
  onConfirm: (c: { id: string; name: string }) => void;
}) {
  return (
    <AlertDialog open={!!client} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá khách hàng {client?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Các dự án sẽ được gỡ liên kết với khách hàng này, và tài khoản cổng
            khách hàng sẽ không còn xem được dự án. Thao tác không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => client && onConfirm(client)}
          >
            Xoá khách hàng
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
