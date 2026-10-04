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
import { Discussion } from './discussion.entity.js';

@Entity('discussion_replies')
export class DiscussionReply extends BaseEntity {
  @Index()
  @Column({ name: 'discussion_id', type: 'uuid' })
  discussionId: string;

  @ManyToOne(() => Discussion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discussion_id' })
  discussion: Relation<Discussion>;

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
