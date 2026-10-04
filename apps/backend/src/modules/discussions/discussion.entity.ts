import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';

@Entity('discussions')
export class Discussion extends BaseEntity {
  // Để trống = thảo luận chung toàn công ty
  @Index()
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project> | null;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;

  @Column({ name: 'mention_ids', type: 'uuid', array: true, default: '{}' })
  mentionIds: string[];

  @Column({ default: false })
  pinned: boolean;

  @Column({ name: 'reply_count', default: 0 })
  replyCount: number;

  @Column({
    name: 'last_activity_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  lastActivityAt: Date;
}
