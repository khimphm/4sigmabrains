import type { Repository } from 'typeorm';

import { User, UserRole, UserStatus } from './user.entity.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import { UsersService } from './users.service.js';

function fakeRepo(existing: User | null) {
  return {
    findOneBy: vi.fn().mockResolvedValue(existing),
    create: vi.fn((data: Partial<User>) => data as User),
    save: vi.fn((user: User) => Promise.resolve(user)),
  } as unknown as Repository<User>;
}

const notifications = {
  notifyAdmins: vi.fn(),
  notify: vi.fn(),
} as unknown as NotificationsService;

const profile = {
  googleId: 'g-1',
  email: 'An@Example.com',
  name: 'An',
  avatarUrl: null,
};

describe('UsersService.upsertFromGoogle', () => {
  it('tạo người dùng mới ở trạng thái chờ duyệt', async () => {
    const user = await new UsersService(
      fakeRepo(null),
      notifications,
    ).upsertFromGoogle(profile, []);
    expect(user.email).toBe('an@example.com');
    expect(user.status).toBe(UserStatus.Pending);
    expect(user.role).toBe(UserRole.Member);
    expect(notifications.notifyAdmins).toHaveBeenCalled();
  });

  it('kích hoạt ngay email nằm trong ADMIN_EMAILS', async () => {
    const user = await new UsersService(
      fakeRepo(null),
      notifications,
    ).upsertFromGoogle(profile, ['an@example.com']);
    expect(user.status).toBe(UserStatus.Active);
    expect(user.role).toBe(UserRole.Admin);
  });

  it('không mở khoá tài khoản đã bị vô hiệu hoá', async () => {
    const existing = Object.assign(new User(), {
      email: 'an@example.com',
      status: UserStatus.Disabled,
      role: UserRole.Member,
    });
    const user = await new UsersService(
      fakeRepo(existing),
      notifications,
    ).upsertFromGoogle(profile, ['an@example.com']);
    expect(user.status).toBe(UserStatus.Disabled);
  });
});
