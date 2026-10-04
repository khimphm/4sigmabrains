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

export enum NotificationType {
  TaskAssigned = 'TASK_ASSIGNED',
  TaskDueSoon = 'TASK_DUE_SOON',
  TaskOverdue = 'TASK_OVERDUE',
  TaskStatusChanged = 'TASK_STATUS_CHANGED',
  TaskCommented = 'TASK_COMMENTED',
  Mentioned = 'MENTIONED',
  DiscussionReply = 'DISCUSSION_REPLY',
  DecisionCreated = 'DECISION_CREATED',
  DecisionMade = 'DECISION_MADE',
  ProjectAdded = 'PROJECT_ADDED',
  MemberPending = 'MEMBER_PENDING',
  AccountApproved = 'ACCOUNT_APPROVED',
}

@Entity('notifications')
@Index(['userId', 'readAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', eager: true, nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: Relation<User> | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'notification_type',
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  // Đường dẫn trong app, vd /projects/<id>?task=<id>
  @Column({ type: 'varchar', nullable: true })
  link: string | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
