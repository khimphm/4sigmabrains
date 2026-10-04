import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';

export enum UserRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Member = 'MEMBER',
}

export enum UserStatus {
  // Mới đăng nhập lần đầu, chờ admin duyệt
  Pending = 'PENDING',
  Active = 'ACTIVE',
  Disabled = 'DISABLED',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({
    name: 'google_id',
    type: 'varchar',
    unique: true,
    nullable: true,
    select: false,
  })
  googleId: string | null;

  @Column()
  name: string;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'varchar', nullable: true })
  department: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.Member,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status',
    default: UserStatus.Pending,
  })
  status: UserStatus;

  // Bật/tắt nhận email thông báo
  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;
}
