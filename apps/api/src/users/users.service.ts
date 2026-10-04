import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole, UserStatus } from './user.entity.js';

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
  ) {}

  findById(id: string) {
    return this.users.findOneBy({ id });
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
      existing.name = profile.name;
      existing.avatarUrl = profile.avatarUrl;
      existing.lastLoginAt = new Date();
      if (isAdmin && existing.status === UserStatus.Pending) {
        existing.status = UserStatus.Active;
        existing.role = UserRole.Admin;
      }
      return this.users.save(existing);
    }

    return this.users.save(
      this.users.create({
        ...profile,
        email,
        role: isAdmin ? UserRole.Admin : UserRole.Member,
        status: isAdmin ? UserStatus.Active : UserStatus.Pending,
        lastLoginAt: new Date(),
      }),
    );
  }
}
