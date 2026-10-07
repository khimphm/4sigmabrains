import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';
import { DecisionOpinion } from './decision-opinion.entity.js';

export enum DecisionStatus {
  // Đang thảo luận, gom ý kiến
  Open = 'OPEN',
  // Đã đóng dấu chốt
  Decided = 'DECIDED',
  Cancelled = 'CANCELLED',
}

// Chủ đề "Phân tích và chốt": gom ý kiến cả nhóm, bình chọn, người có quyền đóng dấu kết luận.
@Entity('decisions')
export class Decision extends BaseEntity {
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project> | null;

  @Column()
  title: string;

  // Bối cảnh / vấn đề cần thống nhất
  @Column({ type: 'text' })
  context: string;

  @Column({
    type: 'enum',
    enum: DecisionStatus,
    enumName: 'decision_status',
    default: DecisionStatus.Open,
  })
  status: DecisionStatus;

  // Hạn chốt
  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User>;

  // Kết luận khi đóng dấu chốt
  @Column({ type: 'text', nullable: true })
  conclusion: string | null;

  @Column({ name: 'decided_by_id', type: 'uuid', nullable: true })
  decidedById: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'decided_by_id' })
  decidedBy: Relation<User> | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @OneToMany(() => DecisionOpinion, (o) => o.decision)
  opinions: Relation<DecisionOpinion[]>;
}
