import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../users/user.entity.js';
import { Task } from './task.entity.js';

@Entity('task_checklist_items')
export class ChecklistItem extends BaseEntity {
  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, (t) => t.checklist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @Column()
  content: string;

  @Column({ default: false })
  done: boolean;

  @Column({ name: 'completed_by_id', type: 'uuid', nullable: true })
  completedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'completed_by_id' })
  completedBy: Relation<User> | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'double precision', default: 0 })
  position: number;
}
