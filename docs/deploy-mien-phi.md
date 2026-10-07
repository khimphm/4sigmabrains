# Deploy miễn phí (Render + Neon + Cloudflare R2)

Tổng chi phí: **0 đồng**. Cần khoảng 30 phút cho lần đầu. Mọi bước làm trên trình duyệt, không cần máy chủ.

| Dịch vụ | Dùng để | Gói miễn phí |
| --- | --- | --- |
| GitHub | Chứa code, CI, nhắc hạn mỗi giờ, sao lưu DB | Miễn phí |
| Render | Chạy web (backend + giao diện) | 750 giờ/tháng; máy ngủ sau 15 phút không ai dùng, mở lại chờ ~1 phút |
| Neon | Database PostgreSQL | 0,5 GB |
| Cloudflare R2 | Lưu file đính kèm | 10 GB, không tính phí tải xuống |
| Google Cloud | Đăng nhập bằng Google | Miễn phí |

> Giới hạn cần biết: Render Free ngủ khi không ai dùng nên lần mở đầu mỗi sáng hơi chậm. Khi đội dùng thường xuyên, nâng Render lên gói Starter (~7 USD/tháng) là hết, không phải sửa code.

## 1. Database trên Neon

1. Đăng ký ở <https://neon.tech> bằng tài khoản GitHub, tạo project tên `4sigmabrains`, chọn region **Singapore**.
2. Ở **Connection string**, copy chuỗi dạng `postgresql://...neon.tech/neondb?sslmode=require`. Đây là `DATABASE_URL`.

## 2. Lưu file trên Cloudflare R2

1. Đăng ký <https://dash.cloudflare.com>, vào **R2 Object Storage** (cần thêm thẻ để kích hoạt nhưng không bị trừ tiền trong hạn mức miễn phí).
2. **Create bucket** tên `4sigmabrains`.
3. **Manage R2 API Tokens → Create API token**, quyền *Object Read & Write*, chỉ cho bucket trên. Ghi lại:
   - `Access Key ID` → `S3_ACCESS_KEY_ID`
   - `Secret Access Key` → `S3_SECRET_ACCESS_KEY`
   - Endpoint `https://<account_id>.r2.cloudflarestorage.com` → `S3_ENDPOINT`

## 3. Đăng nhập Google

1. Vào <https://console.cloud.google.com/apis/credentials>, tạo project, cấu hình **OAuth consent screen** (loại *External*, hoặc *Internal* nếu công ty dùng Google Workspace).
2. **Create credentials → OAuth client ID → Web application**.
3. Tạm để trống redirect URI, sẽ thêm ở bước 5. Ghi lại `Client ID` và `Client secret`.

## 4. Tạo web trên Render

1. Đăng ký <https://render.com> bằng GitHub, cho phép truy cập repo `4sigmabrains`.
2. **New → Blueprint**, chọn repo. Render đọc `render.yaml` và hỏi các biến:

| Biến | Giá trị |
| --- | --- |
| `WEB_URL` | `https://4sigmabrains.onrender.com` (tên Render đặt, xem ở trang dịch vụ) |
| `GOOGLE_CALLBACK_URL` | `https://4sigmabrains.onrender.com/api/auth/google/callback` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Từ bước 3 (không bắt buộc: email + mật khẩu luôn dùng được) |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT` | Tuỳ chọn, đăng nhập bằng Microsoft 365. Callback `…/api/auth/microsoft/callback` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Tuỳ chọn, đăng nhập bằng GitHub. Callback `…/api/auth/github/callback` |
| `ADMIN_EMAILS` | Email Google của bạn (có quyền quản trị ngay) |
| `ALLOWED_EMAIL_DOMAINS` | Để trống, hoặc domain công ty để chỉ cho email công ty đăng nhập |
| `DATABASE_URL` | Từ bước 1 |
| `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Từ bước 2 |
| `SMTP_*`, `MAIL_FROM` | Để trống nếu chưa cần email (vẫn có thông báo trong app) |

`JWT_SECRET` và `CRON_SECRET` Render tự sinh. Bấm **Apply**, đợi build xong (lần đầu ~5 phút). Mở `https://<ten>.onrender.com/api/health` thấy `"status":"ok"` là chạy.

Nếu tên dịch vụ khác `4sigmabrains`, sửa lại `WEB_URL` và `GOOGLE_CALLBACK_URL` trong **Environment** cho khớp.

## 5. Hoàn tất Google OAuth

Quay lại OAuth client ở bước 3, thêm:

- **Authorized JavaScript origins:** `https://4sigmabrains.onrender.com`
- **Authorized redirect URIs:** `https://4sigmabrains.onrender.com/api/auth/google/callback`

Mở web, đăng nhập bằng email trong `ADMIN_EMAILS`. Đồng đội đăng nhập xong sẽ hiện ở **Quản trị thành viên** để bạn duyệt.

## 6. Nhắc hạn và sao lưu bằng GitHub Actions

Vào repo trên GitHub → **Settings → Secrets and variables → Actions**:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Variable | `APP_URL` | `https://4sigmabrains.onrender.com` |
| Secret | `CRON_SECRET` | Copy từ Render → Environment |
| Secret | `DATABASE_URL` | Chuỗi Neon (cho sao lưu) |
| Secret | `BACKUP_PASSPHRASE` | Mật khẩu tự đặt (`npm run secrets`), cất kỹ để giải nén bản sao lưu |

Sau đó tab **Actions** sẽ có:

- **Nhắc hạn công việc:** mỗi giờ gọi web để gửi nhắc việc sắp đến hạn / quá hạn. Bấm *Run workflow* để thử ngay.
- **Sao lưu database:** 2h sáng Chủ nhật, file mã hoá giữ 30 ngày. Giải mã: `gpg --decrypt db.sql.gz.gpg | gunzip > db.sql`.
- **CI:** chạy lint, test, build mỗi lần push hoặc mở PR. Render chỉ deploy khi có commit mới trên `main`.

## 7. Email thông báo (tuỳ chọn)

Dùng Gmail miễn phí: bật xác minh 2 bước, tạo **App password** ở <https://myaccount.google.com/apppasswords>, rồi đặt trên Render:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail>
SMTP_PASS=<app password 16 ký tự>
MAIL_FROM=4SigmaBrains <gmail>
```

## Khi có kinh phí

- Render Starter: không ngủ, nhanh hơn.
- Hoặc thuê VPS (~5 USD/tháng): `git clone`, `cp .env.example .env`, đặt `DOMAIN`, chạy `docker compose -f infra/docker/docker-compose.yml --env-file .env --profile https up -d --build`. Có Postgres, MinIO và HTTPS trên một máy; dữ liệu cũ chuyển bằng `infra/scripts/backup-db.sh` / `restore-db.sh`.
