import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import type { Repository } from 'typeorm';

import type { AppConfig } from '../../config/configuration.js';
import type { MailService } from '../mail/mail.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { ProjectsService } from '../projects/projects.service.js';
import { User, UserRole, UserStatus } from '../users/user.entity.js';
import { AuthService } from './auth.service.js';
import type { UserSession } from './user-session.entity.js';

const provider = {
  enabled: true,
  clientId: 'x',
  clientSecret: 'y',
  callbackUrl: '',
};
const authConfig = {
  google: provider,
  microsoft: { ...provider, enabled: false },
  github: { ...provider, enabled: false },
  jwtSecret: 's',
  jwtExpiresInSeconds: 60,
  adminEmails: ['boss@example.com'],
  allowedEmailDomains: [] as string[],
};

function setup(existing: Partial<User> | null = null, domains: string[] = []) {
  const store: { user: User | null } = {
    user: existing ? Object.assign(new User(), existing) : null,
  };
  const users = {
    findOneBy: vi.fn(async (where: Record<string, unknown>) => {
      if (!store.user) return null;
      const [k, v] = Object.entries(where)[0];
      return (store.user as unknown as Record<string, unknown>)[k] === v
        ? store.user
        : null;
    }),
    findOne: vi.fn(async () => store.user),
    existsBy: vi.fn(async () => !!store.user),
    create: vi.fn((d: Partial<User>) =>
      Object.assign(new User(), { id: 'u1', ...d }),
    ),
    save: vi.fn(async (u: User) => (store.user = u)),
    update: vi.fn(async (_id: string, patch: Partial<User>) => {
      if (store.user) Object.assign(store.user, patch);
    }),
  } as unknown as Repository<User>;
  const sessions = {
    create: vi.fn((d: Partial<UserSession>) => d),
    save: vi.fn(async (d: Partial<UserSession>) => ({ id: 's1', ...d })),
  } as unknown as Repository<UserSession>;
  const notifications = {
    notifyAdmins: vi.fn(),
  } as unknown as NotificationsService;
  const config = {
    get: (key: string) =>
      key === 'auth'
        ? { ...authConfig, allowedEmailDomains: domains }
        : key === 'webUrl'
          ? 'http://web'
          : 'test',
  } as unknown as ConfigService<AppConfig, true>;
  const jwt = {
    signAsync: vi.fn(async () => 'token'),
    verifyAsync: vi.fn(async () => {
      throw new Error('no session');
    }),
  } as unknown as JwtService;
  const service = new AuthService(
    users,
    sessions,
    jwt,
    { enabled: false } as MailService,
    notifications,
    {} as ProjectsService,
    config,
  );
  return { service, store, notifications };
}

const req = { cookies: {}, headers: {} } as unknown as Request;
const res = { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
const profile = {
  id: 'g-1',
  email: 'An@Example.com',
  name: 'An',
  avatarUrl: null,
};

describe('AuthService.oauthLogin', () => {
  it('tạo người dùng mới ở trạng thái chờ duyệt và báo quản trị viên', async () => {
    const { service, notifications } = setup();
    const { user } = await service.oauthLogin('google', profile, req);
    expect(user.email).toBe('an@example.com');
    expect(user.status).toBe(UserStatus.Pending);
    expect(user.role).toBe(UserRole.Member);
    expect(notifications.notifyAdmins).toHaveBeenCalled();
  });

  it('kích hoạt ngay email nằm trong ADMIN_EMAILS', async () => {
    const { service } = setup();
    const { user } = await service.oauthLogin(
      'google',
      { ...profile, email: 'boss@example.com' },
      req,
    );
    expect(user.status).toBe(UserStatus.Active);
    expect(user.role).toBe(UserRole.Admin);
  });

  it('không cho tài khoản đã bị khoá đăng nhập', async () => {
    const { service } = setup({
      id: 'u1',
      email: 'an@example.com',
      status: UserStatus.Disabled,
    });
    await expect(service.oauthLogin('google', profile, req)).rejects.toThrow(
      'khoá',
    );
  });

  it('chặn email ngoài tên miền công ty', async () => {
    const { service } = setup(null, ['4sigmabrains.com']);
    await expect(service.oauthLogin('google', profile, req)).rejects.toThrow(
      '4sigmabrains.com',
    );
  });
});

describe('AuthService đăng nhập bằng mật khẩu', () => {
  it('đăng ký tạo tài khoản chờ duyệt với mật khẩu đã băm', async () => {
    const { service, store } = setup();
    const result = await service.register({
      name: 'Bình',
      email: 'binh@example.com',
      password: 'matkhau123',
    });
    expect(result.status).toBe(UserStatus.Pending);
    expect(store.user?.passwordHash).not.toBe('matkhau123');
    expect(await bcrypt.compare('matkhau123', store.user!.passwordHash!)).toBe(
      true,
    );
  });

  it('sai mật khẩu bị từ chối', async () => {
    const { service } = setup({
      id: 'u1',
      email: 'binh@example.com',
      status: UserStatus.Active,
      passwordHash: await bcrypt.hash('dung123456', 4),
    });
    await expect(
      service.login(req, res, { email: 'binh@example.com', password: 'sai' }),
    ).rejects.toThrow('không đúng');
  });

  it('bật 2 lớp thì chờ mã trước khi cấp phiên', async () => {
    const { service } = setup({
      id: 'u1',
      email: 'binh@example.com',
      status: UserStatus.Active,
      totpEnabled: true,
      passwordHash: await bcrypt.hash('dung123456', 4),
    });
    const result = await service.login(req, res, {
      email: 'binh@example.com',
      password: 'dung123456',
    });
    expect(result.totpRequired).toBe(true);
  });
});
