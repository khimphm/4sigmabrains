// Đọc và kiểm tra biến môi trường một lần lúc khởi động.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

function list(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Callback mặc định: <WEB_URL>/api/auth/<provider>/callback
function oauth(prefix: string) {
  const clientId = process.env[`${prefix}_CLIENT_ID`] ?? '';
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] ?? '';
  const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
  return {
    enabled: !!clientId && !!clientSecret,
    clientId: clientId || 'disabled',
    clientSecret: clientSecret || 'disabled',
    callbackUrl:
      process.env[`${prefix}_CALLBACK_URL`] ??
      `${webUrl}/api/auth/${prefix.toLowerCase()}/callback`,
  };
}

export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',
  // Thư mục chứa bản build frontend. Đặt khi muốn backend phục vụ luôn giao diện (1 dịch vụ duy nhất).
  // Khoá bí mật cho /api/cron/* (GitHub Actions gửi kèm header x-cron-secret)
  cronSecret: process.env.CRON_SECRET ?? '',
  serveStaticDir: process.env.SERVE_STATIC_DIR ?? '',
  database: {
    url: required('DATABASE_URL'),
    ssl: process.env.DATABASE_SSL === 'true',
  },
  // Lưu file trên dịch vụ tương thích S3: MinIO (tự chạy), Cloudflare R2, AWS S3...
  storage: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'auto',
    bucket: process.env.S3_BUCKET ?? 'workspace',
    accessKeyId: required('S3_ACCESS_KEY_ID'),
    secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 25),
  },
  // Để trống SMTP_HOST thì chỉ gửi thông báo trong app, không gửi email.
  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? '4SigmaBrains <no-reply@localhost>',
  },
  auth: {
    // Mỗi cách đăng nhập chỉ bật khi có đủ khoá. Đăng nhập email + mật khẩu luôn bật.
    google: oauth('GOOGLE'),
    microsoft: oauth('MICROSOFT'),
    github: oauth('GITHUB'),
    // Microsoft: "common" cho mọi tài khoản, hoặc tenant ID của công ty
    microsoftTenant: process.env.MICROSOFT_TENANT ?? 'common',
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresInSeconds: Number(
      process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7,
    ),
    // Email trong danh sách này được kích hoạt ngay với quyền ADMIN ở lần đăng nhập đầu.
    adminEmails: list('ADMIN_EMAILS'),
    // Nếu đặt, chỉ email thuộc các domain này mới được đăng nhập (vd: 4sigmabrains.com).
    allowedEmailDomains: list('ALLOWED_EMAIL_DOMAINS'),
  },
});

export type AppConfig = ReturnType<typeof configuration>;
