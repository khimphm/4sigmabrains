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

// Loại lỗi trong bộ nhãn (vd: Thiếu kích thước, Ký hiệu không có trong chú giải)
@Entity('dataset_label_types')
export class LabelType extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: '#F0813F', length: 9 })
  color: string;

  @Column({ type: 'double precision', default: 0 })
  position: number;

  @Column({ default: true })
  active: boolean;
}

// Một đợt bản vẽ (vd: "Đợt 1, 20 bản vẽ kết cấu")
@Entity('dataset_batches')
export class DrawingBatch extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project> | null;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: Relation<User>;
}

export enum DrawingStatus {
  Unlabeled = 'UNLABELED',
  Labeling = 'LABELING',
  InReview = 'IN_REVIEW',
  ChangesRequested = 'CHANGES_REQUESTED',
  Approved = 'APPROVED',
}

@Entity('dataset_drawings')
@Index(['batchId', 'code'], { unique: true })
export class Drawing extends BaseEntity {
  @Column({ name: 'batch_id', type: 'uuid' })
  batchId: string;

  @ManyToOne(() => DrawingBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: Relation<DrawingBatch>;

  // Mã bản vẽ, vd BV-KC-02
  @Column()
  code: string;

  // Tên bản vẽ, vd "Mặt cắt A-A"
  @Column({ type: 'varchar', nullable: true })
  title: string | null;

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

  // Số trang (PDF); nhãn gắn theo trang
  @Column({ name: 'page_count', default: 1 })
  pageCount: number;

  @Column({
    type: 'enum',
    enum: DrawingStatus,
    enumName: 'drawing_status',
    default: DrawingStatus.Unlabeled,
  })
  status: DrawingStatus;

  @Column({ name: 'labeler_id', type: 'uuid', nullable: true })
  labelerId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'labeler_id' })
  labeler: Relation<User> | null;

  @Column({ name: 'reviewer_id', type: 'uuid', nullable: true })
  reviewerId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: Relation<User> | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string | null;
}

export enum AnnotationStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

// Vùng lỗi khoanh trên bản vẽ. Toạ độ chuẩn hoá 0..1 theo kích thước trang.
@Entity('dataset_annotations')
@Index(['drawingId'])
export class Annotation extends BaseEntity {
  @Column({ name: 'drawing_id', type: 'uuid' })
  drawingId: string;

  @ManyToOne(() => Drawing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drawing_id' })
  drawing: Relation<Drawing>;

  @Column({ name: 'label_type_id', type: 'uuid' })
  labelTypeId: string;

  @ManyToOne(() => LabelType, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'label_type_id' })
  labelType: Relation<LabelType>;

  @Column({ default: 1 })
  page: number;

  @Column({ type: 'double precision' })
  x: number;

  @Column({ type: 'double precision' })
  y: number;

  @Column({ type: 'double precision' })
  width: number;

  @Column({ type: 'double precision' })
  height: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({
    type: 'enum',
    enum: AnnotationStatus,
    enumName: 'annotation_status',
    default: AnnotationStatus.Pending,
  })
  status: AnnotationStatus;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;

  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy: Relation<User> | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string | null;
}
