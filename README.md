# 4SigmaBrains Workspace

Web nội bộ của 4SigmaBrains: quản lý dự án, công việc, thảo luận; sau này thêm module Dataset bản vẽ và agent.

Hiện tại mới có **khung dự án + đăng nhập Google** (người mới đăng nhập ở trạng thái chờ duyệt).

| Phần | Công nghệ |
| --- | --- |
| Frontend (`apps/web`) | React 19 + TypeScript (Vite), Tailwind CSS v4, shadcn/ui, React Router, TanStack Query |
| Backend (`apps/api`) | NestJS 12, TypeORM, Passport (Google OAuth + JWT cookie), BullMQ, MinIO client |
| Hạ tầng | PostgreSQL 17, Redis 7, MinIO, Docker Compose, Nginx |

Design token lấy từ Figma "4SigmaBrains / Workspace v1": màu chính `#1F4FD1`, sidebar `#111A24`, font Be Vietnam Pro (xem `apps/web/src/index.css`).

## Cấu trúc

```
apps/
  api/                 NestJS
    src/auth/          Google OAuth, JWT cookie, guard, /auth/me, /auth/logout
    src/users/         Entity User (role, status chờ duyệt) + service
    src/database/      Cấu hình TypeORM + migrations
    src/storage/       MinIO (bucket, presigned URL)
    src/queue/         BullMQ (Redis)
    src/health/        /api/health
  web/                 React
    src/components/ui/ Component shadcn
    src/components/layout/app-shell.tsx  Sidebar + khung trang
    src/features/auth/ useAuth, RequireAuth
    src/pages/         Đăng nhập, chờ duyệt, trang chủ
docker-compose.yml
.env.example
```

## Cấu hình Google OAuth

1. Vào [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), tạo **OAuth client ID** loại *Web application*.
2. Thêm **Authorized redirect URIs**:
   - `http://localhost:5173/api/auth/google/callback` (chạy dev)
   - `http://localhost:8080/api/auth/google/callback` (chạy Docker Compose)
   - `https://<domain-thật>/api/auth/google/callback` (khi deploy)
3. `cp .env.example .env`, điền `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` (`openssl rand -hex 32`) và email của bạn vào `ADMIN_EMAILS`.

Email trong `ADMIN_EMAILS` được kích hoạt ngay với quyền ADMIN. Người khác đăng nhập sẽ thấy màn hình "Đang chờ duyệt" cho tới khi được duyệt (trang duyệt thành viên sẽ làm ở bước sau; tạm thời đổi `status` thành `ACTIVE` trong bảng `users`). Đặt `ALLOWED_EMAIL_DOMAINS` để chỉ cho phép email công ty.

## Chạy khi phát triển

Cần Node 22+ và **npm 11+** (npm 10 có lỗi khi cài backend: `npm i -g npm@11`).

```bash
npm run setup     # cài dependency cho api và web
npm run infra     # bật Postgres, Redis, MinIO bằng Docker
npm run dev:api   # http://localhost:3000/api
npm run dev:web   # http://localhost:5173 (tự proxy /api sang backend)
```

Migration tự chạy khi API khởi động. Tạo migration mới: sửa entity, chạy `npm run migration:generate --prefix apps/api -- src/database/migrations/<ten>`, rồi thêm class vào `src/database/database.options.ts`.

MinIO console: http://localhost:9001 (mặc định `minioadmin` / `minioadmin`).

## Chạy toàn bộ bằng Docker Compose

```bash
cp .env.example .env   # điền như trên
docker compose up -d --build
```

Mở http://localhost:8080. Nginx phục vụ frontend và chuyển `/api` sang backend. Khi deploy lên domain thật, đặt `PUBLIC_URL=https://<domain>` trong `.env`.

> MinIO đã ngừng phát hành image Docker mới từ cuối 2025, nên compose đang ghim bản `RELEASE.2025-09-07T16-13-09Z`. Nếu không kéo được image này, có thể thay bằng một dịch vụ tương thích S3 khác; code chỉ dùng API S3 chuẩn.

## Lệnh khác

```bash
npm run build   # build cả hai
npm run lint    # oxlint
npm test        # unit test backend (vitest)
```
