import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../users/user.entity.js';
import { ProjectMember } from './project-member.entity.js';

export enum ProjectStatus {
  Active = 'ACTIVE',
  OnHold = 'ON_HOLD',
  Completed = 'COMPLETED',
  Archived = 'ARCHIVED',
}

@Entity('projects')
export class Project extends BaseEntity {
  @Column()
  name: string;

  // Mã ngắn dùng để đánh số công việc, vd "TA" -> TA-12
  @Column({ unique: true, length: 10 })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: '#1F4FD1', length: 9 })
  color: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    enumName: 'project_status',
    default: ProjectStatus.Active,
  })
  status: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User>;

  // Bộ đếm để cấp số thứ tự cho công việc mới
  @Column({ name: 'task_seq', default: 0 })
  taskSeq: number;

  @OneToMany(() => ProjectMember, (m) => m.project)
  members: Relation<ProjectMember[]>;
}
