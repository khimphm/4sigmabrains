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

export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',
  database: {
    url: required('DATABASE_URL'),
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: required('MINIO_ACCESS_KEY'),
    secretKey: required('MINIO_SECRET_KEY'),
    bucket: process.env.MINIO_BUCKET ?? 'workspace',
  },
  auth: {
    googleClientId: required('GOOGLE_CLIENT_ID'),
    googleClientSecret: required('GOOGLE_CLIENT_SECRET'),
    googleCallbackUrl: required('GOOGLE_CALLBACK_URL'),
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
