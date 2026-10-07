import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { User } from '../users/user.entity.js';

// Mỗi lần đăng nhập là một phiên; thu hồi phiên = đăng xuất thiết bị đó.
@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  // Cách đăng nhập: google, microsoft, github, password
  @Column({ type: 'varchar' })
  method: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz', default: () => 'now()' })
  lastSeenAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
