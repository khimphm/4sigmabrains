# Kiến trúc

## Tổng thể

```
Trình duyệt ──HTTPS──> Render (1 container Docker)
                         ├─ NestJS /api/*        REST API
                         ├─ Socket.IO /socket.io thông báo realtime
                         └─ file tĩnh React       giao diện (SERVE_STATIC_DIR)
                               │
               ┌───────────────┼──────────────────┐
           Neon Postgres   Cloudflare R2      SMTP (tuỳ chọn)
           (dữ liệu)       (file đính kèm)    (email nhắc việc)

GitHub Actions: CI mỗi lần push · gọi /api/cron/reminders mỗi giờ · sao lưu DB hằng tuần
```

Cả frontend và backend chạy trong **một dịch vụ** để vừa gói miễn phí, không phải cấu hình CORS và cookie giữa hai tên miền. Khi có máy chủ riêng, dùng `infra/docker/docker-compose.yml` (Postgres + MinIO + app + Caddy) mà không phải sửa code: lưu file dùng chuẩn S3 nên R2 và MinIO đổi qua lại chỉ bằng biến môi trường.

## Backend (`apps/backend`)

- **Xác thực:** Google OAuth (Passport) rồi cấp JWT trong cookie `session` (httpOnly). Ba guard toàn cục: giới hạn tần suất, bắt buộc đăng nhập (trừ route `@Public()`), bắt buộc tài khoản đã duyệt (trừ `@AllowPending()`) và kiểm tra vai trò `@Roles()`.
- **Phân quyền:** Quản trị duyệt thành viên và đổi vai trò. Quản trị và Quản lý tạo dự án, chốt quyết định. Trưởng dự án sửa dự án và thành viên của dự án. Thành viên dự án tạo và sửa công việc.
- **Nhắc hạn:** `RemindersService` quét mỗi 10 phút khi máy đang chạy; GitHub Actions gọi thêm mỗi giờ vì Render Free cho máy ngủ. Mỗi lần nhắc được đánh dấu nguyên tử trong DB nên không bao giờ gửi trùng.
- **Thông báo:** lưu vào bảng `notifications`, đẩy realtime qua Socket.IO (phòng `user:<id>`), gửi email nếu người dùng bật và có cấu hình SMTP.
- **Database:** TypeORM, `synchronize` tắt, migration tự chạy khi khởi động.

## Frontend (`apps/frontend`)

- Dữ liệu qua TanStack Query; kéo thả Kanban cập nhật lạc quan (optimistic) rồi đồng bộ.
- Chi tiết công việc mở bằng tham số `?task=<id>` trên URL nên có thể gửi link cho đồng đội.
- Màu và font lấy từ Figma "4SigmaBrains / Workspace v1": `#1F4FD1`, sidebar `#111A24`, Be Vietnam Pro. Có chế độ tối và bố cục điện thoại.

## Dữ liệu chính

| Bảng | Ý nghĩa |
| --- | --- |
| users | Tài khoản Google, vai trò, trạng thái (chờ duyệt / hoạt động / khoá) |
| projects, project_members | Dự án (mã, màu, hạn) và thành viên (trưởng dự án / thành viên) |
| tasks, task_checklist_items, task_comments | Công việc, checklist, bình luận có @nhắc tên |
| attachments | File đính kèm cho công việc, dự án, thảo luận (lưu trên S3) |
| discussions, discussion_replies | Thảo luận chung hoặc theo dự án |
| decisions, decision_options, decision_votes | Phân tích và ra quyết định |
| notifications, activity_logs | Thông báo và lịch sử hoạt động |
