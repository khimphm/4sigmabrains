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

export type EntityKind =
  'project' | 'task' | 'discussion' | 'decision' | 'user';

// Nhật ký: ai làm gì, lúc nào. Dùng cho tab "Hoạt động" và dashboard.
@Entity('activity_logs')
@Index(['entityType', 'entityId'])
@Index(['projectId', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', eager: true, nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: Relation<User> | null;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType: EntityKind;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  // vd: created, updated, status_changed, assigned, commented, deleted
  @Column()
  action: string;

  // Tóm tắt dễ đọc, vd "TA-12 Kiểm tra bản vẽ kết cấu"
  @Column()
  summary: string;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
