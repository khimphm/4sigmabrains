import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { User } from '../users/user.entity.js';
import { Task } from './task.entity.js';

// Người theo dõi công việc: nhận thông báo khi có thay đổi, bình luận
@Entity('task_watchers')
export class TaskWatcher {
  @PrimaryColumn({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
