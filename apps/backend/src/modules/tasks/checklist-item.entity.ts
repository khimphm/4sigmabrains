import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
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

  @Column({ type: 'double precision', default: 0 })
  position: number;
}
