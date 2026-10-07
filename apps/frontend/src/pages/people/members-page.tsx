import {
  AlertTriangle,
  Building2,
  Check,
  CircleDot,
  Clock,
  LayoutGrid,
  List,
  Lock,
  Mail,
  MoreHorizontal,
  Pencil,
  Search,
  Unlock,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/features/auth/use-auth";
import {
  useMemberWorkload,
  useUpdateMember,
  useUsers,
} from "@/features/users/api";
import { errorMessage } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/constants";
import { fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User, UserRole, UserStatus } from "@/types/api";

import { InviteDialog, MemberEditDialog, RolePill } from "./people-ui";

type Tab = "staff" | "pending" | "disabled" | "clients";
type Workload = { open: number; overdue: number; onTime: number; late: number };

const ALL = "__all__";

export function MembersPage() {
  const { user: me, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: users = [], isLoading } = useUsers(isAdmin);
  const { data: workload } = useMemberWorkload();
  const update = useUpdateMember();

  const tab = (isAdmin ? (params.get("tab") as Tab | null) : null) ?? "staff";
  const setTab = (t: Tab) =>
    setParams((p) => (t === "staff" ? p.delete("tab") : p.set("tab", t), p), {
      replace: true,
    });
  const [view, setView] = useState<"grid" | "table">(() => {
    try {
      return localStorage.getItem("members-view") === "table"
        ? "table"
        : "grid";
    } catch {
      return "grid";
    }
  });
  const changeView = (v: "grid" | "table") => {
    setView(v);
    try {
      localStorage.setItem("members-view", v);
    } catch {
      /* bỏ qua */
    }
  };
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>(ALL);
  const [dept, setDept] = useState<string>(ALL);
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [locking, setLocking] = useState<User | null>(null);

  const groups = useMemo(() => {
    const staff = users.filter(
      (u) => u.status === "ACTIVE" && u.role !== "CLIENT",
    );
    return {
      staff,
      pending: users.filter((u) => u.status === "PENDING"),
      disabled: users.filter((u) => u.status === "DISABLED"),
      clients: users.filter(
        (u) => u.role === "CLIENT" && u.status !== "PENDING",
      ),
    };
  }, [users]);
  const departments = useMemo(
    () =>
      [
        ...new Set(
          groups.staff.map((u) => u.department).filter((d): d is string => !!d),
        ),
      ].sort((a, b) => a.localeCompare(b, "vi")),
    [groups.staff],
  );

  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const shown = groups[tab].filter((u) => {
    if (role !== ALL && u.role !== role) return false;
    if (dept !== ALL && u.department !== dept) return false;
    if (!q.trim()) return true;
    const hay = norm(
      [
        u.name,
        u.email,
        u.title,
        u.department,
        u.client?.name,
        ...(u.skills ?? []),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return hay.includes(norm(q.trim()));
  });
  const filtered = q.trim() !== "" || role !== ALL || dept !== ALL;

  const setStatus = (u: User, status: UserStatus, msg: string) =>
    update.mutate(
      { id: u.id, status },
      {
        onSuccess: () => toast.success(msg),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  const actions = (u: User) =>
    isAdmin ? (
      <MemberActions
        user={u}
        isSelf={u.id === me?.id}
        onEdit={() => setEditing(u)}
        onLock={() => setLocking(u)}
        onUnlock={() => setStatus(u, "ACTIVE", `Đã mở khoá ${u.name}`)}
      />
    ) : null;

  const TABS: { value: Tab; label: string; count: number }[] = [
    { value: "staff", label: "Nhân sự", count: groups.staff.length },
    { value: "pending", label: "Chờ duyệt", count: groups.pending.length },
    { value: "disabled", label: "Đã khoá", count: groups.disabled.length },
    {
      value: "clients",
      label: "Tài khoản khách hàng",
      count: groups.clients.length,
    },
  ];

  return (
    <PageContainer wide>
      <PageTopbar
        crumbs={[{ label: "Thành viên" }]}
        actions={
          isAdmin && (
            <Button size="sm" onClick={() => setInviting(true)}>
              <UserPlus />{" "}
              <span className="hidden sm:inline">Mời thành viên</span>
            </Button>
          )
        }
      />
      <PageHeader
        title="Thành viên"
        description={
          isLoading
            ? "Đang tải…"
            : `${groups.staff.length} người trong nhóm${departments.length ? ` · ${departments.length} phòng ban` : ""}`
        }
      />

      {isAdmin && (
        <div
          className="border-border mb-5 flex gap-1 overflow-x-auto border-b"
          role="tablist"
          aria-label="Nhóm tài khoản"
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                tab === t.value
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                  t.value === "pending" && t.count > 0
                    ? "bg-due-soon text-due-soon-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Thanh lọc */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            strokeWidth={1.8}
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, kỹ năng…"
            aria-label="Tìm thành viên"
            className="bg-card pl-9"
          />
        </div>
        {tab !== "clients" && (
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger
              className="bg-card w-[calc(50%-4px)] sm:w-44"
              aria-label="Lọc theo vai trò"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Mọi vai trò</SelectItem>
              {(["ADMIN", "MANAGER", "MEMBER"] as UserRole[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tab !== "clients" && departments.length > 0 && (
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger
              className="bg-card w-[calc(50%-4px)] sm:w-44"
              aria-label="Lọc theo phòng ban"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Mọi phòng ban</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setRole(ALL);
              setDept(ALL);
            }}
          >
            <X /> Xoá lọc
          </Button>
        )}
        {tab === "staff" && (
          <div
            className="bg-card ml-auto hidden rounded-md border p-0.5 sm:flex"
            role="group"
            aria-label="Kiểu hiển thị"
          >
            {(
              [
                ["grid", LayoutGrid, "Dạng thẻ"],
                ["table", List, "Dạng bảng"],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                aria-label={label}
                aria-pressed={view === v}
                title={label}
                onClick={() => changeView(v)}
                className={cn(
                  "grid size-7 cursor-pointer place-items-center rounded transition-colors",
                  view === v
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-subtle",
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-card rounded-[10px] border p-5">
              <div className="flex gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-5 h-6 w-3/4" />
              <Skeleton className="mt-5 h-10 w-full" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Search}
            title="Không có ai khớp bộ lọc"
            description="Thử từ khoá khác hoặc xoá bộ lọc."
          />
        ) : tab === "pending" ? (
          <EmptyState
            icon={Check}
            title="Không có ai đang chờ duyệt"
            description="Người đăng ký mới sẽ xuất hiện ở đây để bạn duyệt."
          />
        ) : tab === "disabled" ? (
          <EmptyState icon={Lock} title="Không có tài khoản bị khoá" />
        ) : tab === "clients" ? (
          <EmptyState
            icon={Building2}
            title="Chưa có tài khoản khách hàng"
            description="Mời chủ đầu tư theo dõi tiến độ dự án qua cổng khách hàng."
            action={
              <Button variant="outline" asChild>
                <Link to="/clients">Đến danh sách khách hàng</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Chưa có thành viên"
            action={
              isAdmin && (
                <Button variant="outline" onClick={() => setInviting(true)}>
                  <UserPlus /> Mời thành viên
                </Button>
              )
            }
          />
        )
      ) : tab === "pending" ? (
        <PendingList users={shown} onDecide={setStatus} />
      ) : tab === "clients" || tab === "disabled" ? (
        <MemberTable
          users={shown}
          workload={workload}
          actions={actions}
          showClient={tab === "clients"}
        />
      ) : view === "table" ? (
        <MemberTable users={shown} workload={workload} actions={actions} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((u) => (
            <MemberCard
              key={u.id}
              user={u}
              isSelf={u.id === me?.id}
              workload={workload?.get(u.id)}
              actions={actions(u)}
            />
          ))}
        </div>
      )}

      <InviteDialog open={inviting} onOpenChange={setInviting} />
      <MemberEditDialog
        user={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        isSelf={editing?.id === me?.id}
      />
      <AlertDialog
        open={!!locking}
        onOpenChange={(o) => !o && setLocking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khoá tài khoản {locking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Người này sẽ bị đăng xuất và không thể đăng nhập cho tới khi được
              mở khoá. Công việc và lịch sử vẫn được giữ nguyên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                locking &&
                setStatus(
                  locking,
                  "DISABLED",
                  `Đã khoá tài khoản ${locking.name}`,
                )
              }
            >
              Khoá tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function MemberActions({
  user,
  isSelf,
  onEdit,
  onLock,
  onUnlock,
}: {
  user: User;
  isSelf: boolean;
  onEdit: () => void;
  onLock: () => void;
  onUnlock: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Thao tác với ${user.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil /> Sửa vai trò & thông tin
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuSeparator />
            {user.status === "DISABLED" ? (
              <DropdownMenuItem onSelect={onUnlock}>
                <Unlock /> Mở khoá tài khoản
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onSelect={onLock}>
                <Lock /> Khoá tài khoản
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkloadStat({ w }: { w?: Workload }) {
  if (!w)
    return (
      <span className="text-muted-foreground text-xs">Chưa có số liệu</span>
    );
  return (
    <div className="flex items-center gap-4 text-[13px]">
      <span className="text-text-secondary flex items-center gap-1.5">
        <CircleDot
          className="text-primary size-3.5"
          strokeWidth={2}
          aria-hidden
        />
        <span className="num text-foreground font-semibold">{w.open}</span> đang
        mở
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5",
          w.overdue ? "text-overdue-foreground" : "text-text-secondary",
        )}
      >
        <AlertTriangle className="size-3.5" strokeWidth={2} aria-hidden />
        <span className="num font-semibold">{w.overdue}</span> quá hạn
      </span>
    </div>
  );
}

function MemberCard({
  user,
  isSelf,
  workload,
  actions,
}: {
  user: User;
  isSelf: boolean;
  workload?: Workload;
  actions: ReactNode;
}) {
  const navigate = useNavigate();
  const skills = user.skills ?? [];
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/members/${user.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/members/${user.id}`)}
      className="bg-card shadow-card hover:border-primary/40 focus-visible:ring-ring/50 group relative flex cursor-pointer flex-col rounded-[10px] border p-5 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] motion-reduce:transform-none"
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={user} className="size-12 shrink-0 [&_[data-slot=avatar-fallback]]:text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="group-hover:text-primary truncate text-[15px] font-bold transition-colors">
              {user.name}
            </h3>
            {isSelf && (
              <span className="text-muted-foreground shrink-0 text-xs">
                (bạn)
              </span>
            )}
          </div>
          <p className="text-text-secondary truncate text-[13px]">
            {user.title || "Chưa cập nhật chức danh"}
          </p>
        </div>
        <div className="-mt-1 -mr-2">{actions}</div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <RolePill role={user.role} />
        {user.department && (
          <span className="bg-subtle text-text-secondary inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs font-medium">
            <Building2 className="size-3" strokeWidth={1.8} aria-hidden />
            {user.department}
          </span>
        )}
      </div>

      <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
        {skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className="text-text-secondary inline-flex h-6 items-center rounded-full border px-2.5 text-xs"
          >
            {s}
          </span>
        ))}
        {skills.length > 3 && (
          <span
            className="text-muted-foreground inline-flex h-6 items-center text-xs"
            title={skills.slice(3).join(", ")}
          >
            +{skills.length - 3}
          </span>
        )}
        {!skills.length && (
          <span className="text-muted-foreground text-xs italic">
            Chưa thêm kỹ năng
          </span>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="border-t pt-3">
          <WorkloadStat w={workload} />
          <a
            href={`mailto:${user.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-primary mt-2 flex items-center gap-1.5 text-xs transition-colors"
          >
            <Mail className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
            <span className="truncate">{user.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function MemberTable({
  users,
  workload,
  actions,
  showClient,
}: {
  users: User[];
  workload?: Map<string, Workload>;
  actions: (u: User) => ReactNode;
  showClient?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-card shadow-card overflow-hidden rounded-[10px] border">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-subtle hover:bg-subtle">
              <TableHead className="pl-5">Thành viên</TableHead>
              {showClient ? (
                <TableHead>Khách hàng</TableHead>
              ) : (
                <TableHead>Chức danh · Phòng ban</TableHead>
              )}
              <TableHead>Vai trò</TableHead>
              {!showClient && (
                <TableHead className="text-right">Đang mở</TableHead>
              )}
              {!showClient && (
                <TableHead className="text-right">Quá hạn</TableHead>
              )}
              <TableHead>Đăng nhập gần nhất</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const w = workload?.get(u.id);
              const go = () =>
                u.role === "CLIENT" && u.clientId
                  ? navigate(`/clients/${u.clientId}`)
                  : navigate(`/members/${u.id}`);
              return (
                <TableRow key={u.id} className="cursor-pointer" onClick={go}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} className="size-8" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{u.name}</div>
                        <div className="text-muted-foreground truncate text-xs">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {showClient ? (
                      (u.client?.name ?? (
                        <span className="text-muted-foreground">Chưa gắn</span>
                      ))
                    ) : (
                      <>
                        <div className="truncate">{u.title || "—"}</div>
                        {u.department && (
                          <div className="text-muted-foreground text-xs">
                            {u.department}
                          </div>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <RolePill role={u.role} />
                  </TableCell>
                  {!showClient && (
                    <TableCell className="num text-right font-semibold">
                      {w?.open ?? "—"}
                    </TableCell>
                  )}
                  {!showClient && (
                    <TableCell
                      className={cn(
                        "num text-right font-semibold",
                        w?.overdue
                          ? "text-overdue-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {w?.overdue ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground text-[13px]">
                    {u.lastLoginAt ? (
                      <span className="flex items-center gap-1.5">
                        <Clock
                          className="size-3.5"
                          strokeWidth={1.8}
                          aria-hidden
                        />
                        {fromNow(u.lastLoginAt)}
                      </span>
                    ) : (
                      "Chưa đăng nhập"
                    )}
                  </TableCell>
                  <TableCell
                    className="pr-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(u)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PendingList({
  users,
  onDecide,
}: {
  users: User[];
  onDecide: (u: User, s: UserStatus, msg: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-text-secondary text-sm">
        Những người này đã đăng ký hoặc đăng nhập lần đầu và đang chờ bạn duyệt.
        Sau khi duyệt, có thể đổi vai trò trong tab Nhân sự.
      </p>
      {users.map((u) => (
        <div
          key={u.id}
          className="bg-card shadow-card flex flex-wrap items-center gap-3 rounded-[10px] border p-4"
        >
          <UserAvatar user={u} className="size-10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{u.name}</span>
              <span className="bg-due-soon text-due-soon-foreground inline-flex h-5 items-center rounded px-1.5 text-[11px] font-semibold">
                Chờ duyệt
              </span>
            </div>
            <div className="text-muted-foreground truncate text-[13px]">
              {u.email} · đăng ký {fromNow(u.createdAt)}
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => onDecide(u, "DISABLED", `Đã từ chối ${u.name}`)}
            >
              <X /> Từ chối
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-on-time-foreground/40 text-on-time-foreground hover:bg-on-time flex-1 sm:flex-none"
              onClick={() => onDecide(u, "ACTIVE", `Đã duyệt ${u.name}`)}
            >
              <Check /> Duyệt
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
