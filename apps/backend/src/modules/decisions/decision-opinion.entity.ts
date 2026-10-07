import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../users/user.entity.js';
import { Decision } from './decision.entity.js';

export enum OpinionKind {
  Opinion = 'OPINION',
  Question = 'QUESTION',
  Proposal = 'PROPOSAL',
}

// Một ý kiến / câu hỏi / đề xuất trong chủ đề; parentId != null là câu trả lời.
@Entity('decision_opinions')
@Index(['decisionId', 'createdAt'])
export class DecisionOpinion extends BaseEntity {
  @Column({ name: 'decision_id', type: 'uuid' })
  decisionId: string;

  @ManyToOne(() => Decision, (d) => d.opinions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'decision_id' })
  decision: Relation<Decision>;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => DecisionOpinion, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Relation<DecisionOpinion> | null;

  @Column({
    type: 'enum',
    enum: OpinionKind,
    enumName: 'opinion_kind',
    default: OpinionKind.Opinion,
  })
  kind: OpinionKind;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'mention_ids', type: 'uuid', array: true, default: '{}' })
  mentionIds: string[];

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;
}

// Nút "Đồng ý" cho một ý kiến
@Entity('decision_opinion_agrees')
export class OpinionAgree {
  @PrimaryColumn({ name: 'opinion_id', type: 'uuid' })
  opinionId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => DecisionOpinion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opinion_id' })
  opinion: Relation<DecisionOpinion>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
