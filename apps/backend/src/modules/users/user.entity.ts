import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { Client } from '../clients/client.entity.js';

export enum UserRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Member = 'MEMBER',
  // Khách hàng / chủ đầu tư: chỉ xem dự án của công ty mình qua cổng khách hàng
  Client = 'CLIENT',
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

  @Column({
    name: 'microsoft_id',
    type: 'varchar',
    unique: true,
    nullable: true,
    select: false,
  })
  microsoftId: string | null;

  @Column({
    name: 'github_id',
    type: 'varchar',
    unique: true,
    nullable: true,
    select: false,
  })
  githubId: string | null;

  // bcrypt; để trống nếu chỉ đăng nhập bằng Google/Microsoft/GitHub
  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @Column({
    name: 'totp_secret',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  totpSecret: string | null;

  @Column({ name: 'totp_enabled', default: false })
  totpEnabled: boolean;

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

  @Column({ type: 'text', array: true, default: '{}' })
  skills: string[];

  // Khách hàng mà tài khoản CLIENT thuộc về
  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId: string | null;

  @ManyToOne(() => Client, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Relation<Client> | null;

  // Kênh nhận thông báo
  @Column({ name: 'web_notifications', default: true })
  webNotifications: boolean;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  // Nhắc trước hạn 24 giờ / 2 giờ
  @Column({ name: 'remind_24h', default: true })
  remind24h: boolean;

  @Column({ name: 'remind_2h', default: true })
  remind2h: boolean;

  // Khoá bí mật cho link lịch iCal cá nhân
  @Column({
    name: 'calendar_token',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  calendarToken: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;
}
