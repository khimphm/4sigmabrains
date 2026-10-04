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

export enum AttachmentTarget {
  Task = 'TASK',
  Project = 'PROJECT',
  Discussion = 'DISCUSSION',
}

@Entity('attachments')
@Index(['targetType', 'targetId'])
export class Attachment extends BaseEntity {
  @Column({
    name: 'target_type',
    type: 'enum',
    enum: AttachmentTarget,
    enumName: 'attachment_target',
  })
  targetType: AttachmentTarget;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  size: number;

  @Column({ name: 'object_key', select: false })
  objectKey: string;

  @Column({ name: 'uploader_id', type: 'uuid' })
  uploaderId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploader_id' })
  uploader: Relation<User>;
}
