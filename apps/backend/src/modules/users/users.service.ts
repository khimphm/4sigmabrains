import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User, UserRole, UserStatus } from './user.entity.js';
import type { UpdateMemberDto, UpdateProfileDto } from './users.dto.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  findById(id: string) {
    return this.users.findOneBy({ id });
  }

  async get(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  // Thành viên đang hoạt động (dùng cho chọn người làm, @nhắc tên); admin xem được tất cả.
  list(includeAll: boolean) {
    return this.users.find({
      where: includeAll ? {} : { status: UserStatus.Active },
      order: { status: 'ASC', name: 'ASC' },
    });
  }

  // Tạo hoặc cập nhật người dùng sau khi Google xác thực thành công.
  async upsertFromGoogle(
    profile: GoogleProfile,
    adminEmails: string[],
  ): Promise<User> {
    const email = profile.email.toLowerCase();
    const isAdmin = adminEmails.includes(email);
    const existing = await this.users.findOneBy({ email });

    if (existing) {
      existing.googleId = profile.googleId;
      existing.avatarUrl = profile.avatarUrl ?? existing.avatarUrl;
      existing.lastLoginAt = new Date();
      if (isAdmin && existing.status === UserStatus.Pending) {
        existing.status = UserStatus.Active;
        existing.role = UserRole.Admin;
      }
      return this.users.save(existing);
    }

    const user = await this.users.save(
      this.users.create({
        ...profile,
        email,
        role: isAdmin ? UserRole.Admin : UserRole.Member,
        status: isAdmin ? UserStatus.Active : UserStatus.Pending,
        lastLoginAt: new Date(),
      }),
    );
    if (user.status === UserStatus.Pending) {
      await this.notifications.notifyAdmins({
        type: NotificationType.MemberPending,
        title: `${user.name} đang chờ duyệt`,
        body: `${user.email} vừa đăng nhập lần đầu và cần được duyệt.`,
        link: '/admin/members',
      });
    }
    return user;
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    await this.users.update(user.id, dto);
    return this.get(user.id);
  }

  async updateMember(actor: User, id: string, dto: UpdateMemberDto) {
    if (actor.id === id)
      throw new BadRequestException(
        'Không thể tự đổi quyền hoặc trạng thái của chính mình',
      );
    const member = await this.get(id);
    const wasPending = member.status === UserStatus.Pending;
    await this.users.update(id, dto);
    const saved = await this.get(id);
    if (wasPending && saved.status === UserStatus.Active) {
      await this.notifications.notify([saved.id], {
        type: NotificationType.AccountApproved,
        title: 'Tài khoản của bạn đã được duyệt',
        body: 'Bạn đã có thể sử dụng không gian làm việc 4SigmaBrains.',
        link: '/',
        actorId: actor.id,
      });
    }
    return saved;
  }
}
