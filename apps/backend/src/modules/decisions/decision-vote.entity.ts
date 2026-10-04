import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../users/user.entity.js';
import { DecisionOption } from './decision-option.entity.js';
import { Decision } from './decision.entity.js';

// Mỗi người 1 phiếu cho mỗi quyết định, có thể đổi phiếu khi còn mở.
@Entity('decision_votes')
@Unique(['decisionId', 'userId'])
export class DecisionVote extends BaseEntity {
  @Column({ name: 'decision_id', type: 'uuid' })
  decisionId: string;

  @ManyToOne(() => Decision, (d) => d.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'decision_id' })
  decision: Relation<Decision>;

  @Column({ name: 'option_id', type: 'uuid' })
  optionId: string;

  @ManyToOne(() => DecisionOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'option_id' })
  option: Relation<DecisionOption>;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
