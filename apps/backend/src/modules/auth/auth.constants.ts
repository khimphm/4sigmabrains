export const SESSION_COOKIE = 'session';
// Đã qua bước 1 (mật khẩu hoặc OAuth), đang chờ nhập mã xác thực 2 lớp
export const PENDING_2FA_COOKIE = 'pending_2fa';

export type LoginMethod = 'google' | 'microsoft' | 'github' | 'password';
export type OAuthProvider = 'google' | 'microsoft' | 'github';
export const OAUTH_PROVIDERS: OAuthProvider[] = [
  'google',
  'microsoft',
  'github',
];

export const PROVIDER_COLUMN: Record<
  OAuthProvider,
  'googleId' | 'microsoftId' | 'githubId'
> = {
  google: 'googleId',
  microsoft: 'microsoftId',
  github: 'githubId',
};

export const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  github: 'GitHub',
};
