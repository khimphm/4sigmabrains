import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';
import { ChecklistItem } from './checklist-item.entity.js';

export enum TaskStatus {
  Todo = 'TODO',
  InProgress = 'IN_PROGRESS',
  Review = 'REVIEW',
  Done = 'DONE',
}

export enum TaskPriority {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Urgent = 'URGENT',
}

@Entity('tasks')
@Index(['projectId', 'number'], { unique: true })
export class Task extends BaseEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  // Số thứ tự trong dự án, hiển thị dạng KEY-number
  @Column()
  number: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
    default: TaskStatus.Todo,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    enumName: 'task_priority',
    default: TaskPriority.Medium,
  })
  priority: TaskPriority;

  @Index()
  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: Relation<User> | null;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: Relation<User>;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Index()
  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', array: true, default: '{}' })
  labels: string[];

  // Thứ tự trong cột Kanban
  @Column({ type: 'double precision', default: 0 })
  position: number;

  @Column({
    name: 'reminder_sent_at',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  reminderSentAt: Date | null;

  @Column({
    name: 'overdue_notified_at',
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  overdueNotifiedAt: Date | null;

  @OneToMany(() => ChecklistItem, (c) => c.task)
  checklist: Relation<ChecklistItem[]>;
}
