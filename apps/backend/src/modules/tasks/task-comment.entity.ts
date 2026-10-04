import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../users/user.entity.js';
import { Task } from './task.entity.js';

@Entity('task_comments')
export class TaskComment extends BaseEntity {
  @Index()
  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'mention_ids', type: 'uuid', array: true, default: '{}' })
  mentionIds: string[];
}
