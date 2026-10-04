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
import { DecisionOption } from './decision-option.entity.js';
import { DecisionVote } from './decision-vote.entity.js';

export enum DecisionStatus {
  // Đang thảo luận và bình chọn
  Open = 'OPEN',
  Decided = 'DECIDED',
  Cancelled = 'CANCELLED',
}

@Entity('decisions')
export class Decision extends BaseEntity {
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project> | null;

  @Column()
  title: string;

  // Bối cảnh / vấn đề cần quyết định
  @Column({ type: 'text' })
  context: string;

  @Column({
    type: 'enum',
    enum: DecisionStatus,
    enumName: 'decision_status',
    default: DecisionStatus.Open,
  })
  status: DecisionStatus;

  // Hạn chốt quyết định
  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User>;

  @Column({ name: 'chosen_option_id', type: 'uuid', nullable: true })
  chosenOptionId: string | null;

  // Lý do chọn phương án
  @Column({ type: 'text', nullable: true })
  rationale: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @OneToMany(() => DecisionOption, (o) => o.decision, { cascade: true })
  options: Relation<DecisionOption[]>;

  @OneToMany(() => DecisionVote, (v) => v.decision)
  votes: Relation<DecisionVote[]>;
}
