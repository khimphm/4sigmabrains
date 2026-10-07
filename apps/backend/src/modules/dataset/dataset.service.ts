import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import type { AppConfig } from '../../config/configuration.js';
import { StorageService } from '../../infrastructure/storage/storage.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { User } from '../users/user.entity.js';
import {
  Annotation,
  AnnotationStatus,
  Drawing,
  DrawingBatch,
  DrawingStatus,
  LabelType,
} from './dataset.entities.js';
import type {
  AnnotationDto,
  BatchDto,
  LabelTypeDto,
  ReviewDto,
  UpdateAnnotationDto,
  UpdateBatchDto,
  UpdateDrawingDto,
  UpdateLabelTypeDto,
} from './dataset.dto.js';

const EDITABLE = [
  DrawingStatus.Unlabeled,
  DrawingStatus.Labeling,
  DrawingStatus.ChangesRequested,
];
// Đếm nhanh số trang PDF theo các đối tượng /Type /Page (trình duyệt sẽ đồng bộ lại nếu lệch)
const pdfPageCount = (file: Express.Multer.File) => {
  if (file.mimetype !== 'application/pdf') return 1;
  const pages = file.buffer
    .toString('latin1')
    .match(/\/Type\s*\/Page(?![s\w])/g);
  return Math.max(1, pages?.length ?? 1);
};

const drawingLink = (d: Drawing) => `/dataset/drawings/${d.id}`;

@Injectable()
export class DatasetService {
  private readonly webUrl: string;

  constructor(
    @InjectRepository(LabelType) private readonly labels: Repository<LabelType>,
    @InjectRepository(DrawingBatch)
    private readonly batches: Repository<DrawingBatch>,
    @InjectRepository(Drawing) private readonly drawings: Repository<Drawing>,
    @InjectRepository(Annotation)
    private readonly annotations: Repository<Annotation>,
    private readonly db: DataSource,
    private readonly storage: StorageService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.webUrl = config.get('webUrl', { infer: true });
  }

  // ---------- Thống kê ----------
  async stats(batchId?: string) {
    const params = batchId ? [batchId] : [];
    const filter = batchId ? 'WHERE d.batch_id = $1' : '';
    const [[drawings], byLabel] = await Promise.all([
      this.db.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
                count(*) FILTER (WHERE status = 'IN_REVIEW')::int AS "inReview",
                count(*) FILTER (WHERE status = 'LABELING')::int AS labeling,
                count(*) FILTER (WHERE status = 'CHANGES_REQUESTED')::int AS "changesRequested",
                count(*) FILTER (WHERE status = 'UNLABELED')::int AS unlabeled
           FROM dataset_drawings d ${filter}`,
        params,
      ),
      this.db.query(
        `SELECT l.id, l.name, l.color, count(a.id)::int AS count
           FROM dataset_label_types l
           LEFT JOIN dataset_annotations a ON a.label_type_id = l.id AND a.status <> 'REJECTED'
           ${batchId ? 'AND a.drawing_id IN (SELECT id FROM dataset_drawings WHERE batch_id = $1)' : ''}
          GROUP BY l.id ORDER BY l.position`,
        params,
      ),
    ]);
    return { ...drawings, byLabel };
  }

  // ---------- Bộ nhãn lỗi ----------
  listLabels() {
    return this.labels.find({ order: { position: 'ASC', name: 'ASC' } });
  }

  async createLabel(dto: LabelTypeDto) {
    if (await this.labels.existsBy({ name: dto.name }))
      throw new ConflictException('Nhãn này đã có');
    return this.labels.save(
      this.labels.create({ position: Date.now(), ...dto }),
    );
  }

  async updateLabel(id: string, dto: UpdateLabelTypeDto) {
    await this.labels.update(id, dto);
    return this.labels.findOneByOrFail({ id });
  }

  // Nhãn đã được dùng thì chỉ ẩn đi để giữ dữ liệu cũ
  async removeLabel(id: string) {
    if (await this.annotations.existsBy({ labelTypeId: id })) {
      await this.labels.update(id, { active: false });
      return { archived: true };
    }
    await this.labels.delete(id);
    return { archived: false };
  }

  // ---------- Đợt bản vẽ ----------
  async listBatches() {
    const batches = await this.batches.find({
      relations: { project: true },
      order: { createdAt: 'DESC' },
    });
    const counts: Record<string, string>[] = await this.db.query(
      `SELECT batch_id, count(*) AS total,
              count(*) FILTER (WHERE status = 'APPROVED') AS approved,
              count(*) FILTER (WHERE status = 'IN_REVIEW') AS in_review
         FROM dataset_drawings GROUP BY batch_id`,
    );
    const byId = new Map(counts.map((c) => [c.batch_id, c]));
    return batches.map((b) => ({
      ...b,
      total: Number(byId.get(b.id)?.total ?? 0),
      approved: Number(byId.get(b.id)?.approved ?? 0),
      inReview: Number(byId.get(b.id)?.in_review ?? 0),
    }));
  }

  async getBatch(id: string) {
    const batch = await this.batches.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!batch) throw new NotFoundException('Không tìm thấy đợt bản vẽ');
    return batch;
  }

  createBatch(user: User, dto: BatchDto) {
    return this.batches.save(
      this.batches.create({ ...dto, createdById: user.id }),
    );
  }

  async updateBatch(id: string, dto: UpdateBatchDto) {
    await this.batches.update(id, dto);
    return this.getBatch(id);
  }

  async removeBatch(id: string) {
    const drawings = await this.drawings.find({
      where: { batchId: id },
      select: { id: true, objectKey: true },
    });
    for (const d of drawings) await this.storage.remove(d.objectKey);
    await this.batches.delete(id);
  }

  // ---------- Bản vẽ ----------
  async listDrawings(batchId: string) {
    const drawings = await this.drawings.find({
      where: { batchId },
      order: { code: 'ASC' },
    });
    const counts: { drawing_id: string; count: string }[] = await this.db.query(
      `SELECT drawing_id, count(*) FROM dataset_annotations
        WHERE drawing_id IN (SELECT id FROM dataset_drawings WHERE batch_id = $1)
        GROUP BY drawing_id`,
      [batchId],
    );
    const byId = new Map(counts.map((c) => [c.drawing_id, Number(c.count)]));
    return drawings.map((d) => ({
      ...d,
      annotationCount: byId.get(d.id) ?? 0,
    }));
  }

  async uploadDrawings(
    user: User,
    batchId: string,
    files: Express.Multer.File[],
  ) {
    await this.getBatch(batchId);
    if (!files?.length) throw new BadRequestException('Chưa chọn bản vẽ');
    const allowed = /^(application\/pdf|image\/(png|jpe?g|webp))$/;
    const bad = files.find((f) => !allowed.test(f.mimetype));
    if (bad)
      throw new BadRequestException(
        'Chỉ nhận PDF hoặc ảnh PNG/JPG/WEBP. File DWG cần xuất ra PDF trước.',
      );
    const created: Drawing[] = [];
    for (const file of files) {
      const fileName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      let code = fileName.replace(/\.[^.]+$/, '').slice(0, 60);
      // Trùng mã trong đợt thì thêm hậu tố
      for (let i = 2; await this.drawings.existsBy({ batchId, code }); i++)
        code = `${fileName.replace(/\.[^.]+$/, '').slice(0, 55)}-${i}`;
      const objectKey = await this.storage.upload(
        `dataset/${batchId}`,
        file.buffer,
        file.mimetype,
      );
      created.push(
        await this.drawings.save(
          this.drawings.create({
            batchId,
            code,
            fileName,
            mimeType: file.mimetype,
            size: file.size,
            pageCount: pdfPageCount(file),
            objectKey,
          }),
        ),
      );
    }
    await this.activity.log({
      actorId: user.id,
      entityType: 'drawing',
      entityId: batchId,
      action: 'uploaded',
      summary: `${created.length} bản vẽ`,
    });
    return created;
  }

  private async findDrawing(id: string) {
    const d = await this.drawings.findOne({
      where: { id },
      relations: { batch: true },
    });
    if (!d) throw new NotFoundException('Không tìm thấy bản vẽ');
    return d;
  }

  async getDrawing(id: string) {
    const drawing = await this.findDrawing(id);
    const annotations = await this.annotations.find({
      where: { drawingId: id },
      order: { createdAt: 'ASC' },
    });
    // Bản vẽ trước / sau trong đợt để chuyển nhanh
    const siblings: { id: string; code: string }[] = await this.db.query(
      'SELECT id, code FROM dataset_drawings WHERE batch_id = $1 ORDER BY code',
      [drawing.batchId],
    );
    const i = siblings.findIndex((s) => s.id === id);
    return {
      ...drawing,
      annotations,
      prevId: siblings[i - 1]?.id ?? null,
      nextId: siblings[i + 1]?.id ?? null,
    };
  }

  async openFile(id: string) {
    const d = await this.drawings.findOne({
      where: { id },
      select: {
        id: true,
        objectKey: true,
        mimeType: true,
        size: true,
        fileName: true,
      },
    });
    if (!d) throw new NotFoundException('Không tìm thấy bản vẽ');
    return { drawing: d, stream: await this.storage.download(d.objectKey) };
  }

  async updateDrawing(id: string, dto: UpdateDrawingDto) {
    await this.drawings.update(id, dto);
    return this.getDrawing(id);
  }

  async removeDrawing(user: User, id: string) {
    assertCan(isManager(user), 'Chỉ quản lý được xoá bản vẽ');
    const d = await this.drawings.findOne({
      where: { id },
      select: { id: true, objectKey: true },
    });
    if (!d) throw new NotFoundException();
    await this.storage.remove(d.objectKey);
    await this.drawings.delete(id);
  }

  // ---------- Khoanh vùng lỗi ----------
  private assertEditable(d: Drawing) {
    if (!EDITABLE.includes(d.status))
      throw new BadRequestException(
        d.status === DrawingStatus.InReview
          ? 'Bản vẽ đang chờ duyệt, không sửa nhãn được'
          : 'Bản vẽ đã duyệt xong',
      );
  }

  async addAnnotation(user: User, drawingId: string, dto: AnnotationDto) {
    const d = await this.findDrawing(drawingId);
    this.assertEditable(d);
    const saved = await this.annotations.save(
      this.annotations.create({ ...dto, drawingId, authorId: user.id }),
    );
    if (d.status === DrawingStatus.Unlabeled || !d.labelerId)
      await this.drawings.update(drawingId, {
        status: DrawingStatus.Labeling,
        labelerId: d.labelerId ?? user.id,
      });
    return this.annotations.findOneByOrFail({ id: saved.id });
  }

  private async findAnnotation(id: string) {
    const a = await this.annotations.findOne({
      where: { id },
      relations: { drawing: true },
    });
    if (!a) throw new NotFoundException('Không tìm thấy nhãn');
    return a;
  }

  async updateAnnotation(user: User, id: string, dto: UpdateAnnotationDto) {
    const a = await this.findAnnotation(id);
    this.assertEditable(a.drawing);
    // Sửa lại nhãn bị trả về thì đưa về chờ duyệt
    await this.annotations.update(id, {
      ...dto,
      status: AnnotationStatus.Pending,
      reviewNote: null,
    });
    return this.annotations.findOneByOrFail({ id });
  }

  async removeAnnotation(user: User, id: string) {
    const a = await this.findAnnotation(id);
    this.assertEditable(a.drawing);
    assertCan(a.authorId === user.id || isManager(user));
    await this.annotations.delete(id);
  }

  // ---------- Gửi duyệt / duyệt chéo ----------
  async submit(user: User, id: string, reviewerId?: string) {
    const d = await this.findDrawing(id);
    this.assertEditable(d);
    if (!(await this.annotations.existsBy({ drawingId: id })))
      throw new BadRequestException(
        'Chưa có nhãn nào. Nếu bản vẽ không có lỗi, hãy ghi chú rồi gửi duyệt bằng nhãn phù hợp.',
      );
    const reviewer = reviewerId ?? d.reviewerId;
    if (reviewer && reviewer === (d.labelerId ?? user.id))
      throw new BadRequestException(
        'Người duyệt phải khác người gán nhãn (duyệt chéo)',
      );
    await this.drawings.update(id, {
      status: DrawingStatus.InReview,
      submittedAt: new Date(),
      reviewerId: reviewer ?? null,
      labelerId: d.labelerId ?? user.id,
    });
    const recipients: string[] = reviewer
      ? [reviewer]
      : (
          await this.db.query(
            `SELECT id FROM users WHERE status = 'ACTIVE' AND role IN ('ADMIN','MANAGER')`,
          )
        ).map((r: { id: string }) => r.id);
    await this.notifications.notify(recipients, {
      type: NotificationType.DrawingReview,
      title: `Cần duyệt bản vẽ ${d.code}`,
      body: `${user.name} đã gán nhãn xong, nhờ duyệt chéo.`,
      link: drawingLink(d),
      actorId: user.id,
    });
    return this.getDrawing(id);
  }

  async review(user: User, id: string, dto: ReviewDto) {
    const d = await this.findDrawing(id);
    if (d.status !== DrawingStatus.InReview)
      throw new BadRequestException('Bản vẽ chưa được gửi duyệt');
    if (d.labelerId === user.id)
      throw new BadRequestException('Không tự duyệt bản vẽ mình gán nhãn');
    if (d.reviewerId && d.reviewerId !== user.id && !isManager(user))
      throw new BadRequestException('Bản vẽ này đã giao cho người khác duyệt');
    for (const r of dto.annotations ?? []) {
      await this.annotations.update(
        { id: r.id, drawingId: id },
        {
          status: r.status,
          reviewNote: r.reviewNote ?? null,
          reviewedById: user.id,
        },
      );
    }
    const approve = dto.decision === 'APPROVE';
    if (approve) {
      // Duyệt cả bản vẽ: nhãn chưa đánh giá coi như đạt
      await this.annotations.update(
        { drawingId: id, status: AnnotationStatus.Pending },
        { status: AnnotationStatus.Approved, reviewedById: user.id },
      );
    }
    await this.drawings.update(id, {
      status: approve ? DrawingStatus.Approved : DrawingStatus.ChangesRequested,
      reviewerId: user.id,
      reviewedAt: new Date(),
      reviewNote: dto.note ?? null,
    });
    await this.notifications.notify([d.labelerId], {
      type: NotificationType.DrawingReviewed,
      title: approve
        ? `Bản vẽ ${d.code} đã được duyệt`
        : `Bản vẽ ${d.code} cần sửa nhãn`,
      body: dto.note ?? null,
      link: drawingLink(d),
      actorId: user.id,
    });
    await this.activity.log({
      actorId: user.id,
      entityType: 'drawing',
      entityId: id,
      action: approve ? 'approved' : 'changes_requested',
      summary: d.code,
    });
    return this.getDrawing(id);
  }

  // ---------- Xuất dữ liệu training ----------
  // jsonl: mỗi dòng 1 trang bản vẽ; coco: toạ độ theo thang 1000 x 1000 mỗi trang.
  async export(format: 'jsonl' | 'coco', batchId?: string, includeAll = false) {
    const params: unknown[] = [];
    const where = [includeAll ? 'TRUE' : `d.status = 'APPROVED'`];
    if (batchId) {
      params.push(batchId);
      where.push(`d.batch_id = $${params.length}`);
    }
    const rows: {
      id: string;
      code: string;
      title: string | null;
      file_name: string;
      page_count: number;
      batch: string;
      annotations: {
        label: string;
        label_id: string;
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
        note: string | null;
      }[];
    }[] = await this.db.query(
      `SELECT d.id, d.code, d.title, d.file_name, d.page_count, b.name AS batch,
              coalesce(json_agg(json_build_object(
                'label', l.name, 'label_id', l.id, 'page', a.page, 'x', a.x, 'y', a.y,
                'width', a.width, 'height', a.height, 'note', a.note
              ) ORDER BY a.created_at) FILTER (WHERE a.id IS NOT NULL), '[]') AS annotations
         FROM dataset_drawings d
         JOIN dataset_batches b ON b.id = d.batch_id
         LEFT JOIN dataset_annotations a ON a.drawing_id = d.id AND a.status <> 'REJECTED'
         LEFT JOIN dataset_label_types l ON l.id = a.label_type_id
        WHERE ${where.join(' AND ')}
        GROUP BY d.id, b.name ORDER BY b.name, d.code`,
      params,
    );
    const fileUrl = (id: string) =>
      `${this.webUrl}/api/dataset/drawings/${id}/file`;

    if (format === 'jsonl') {
      return rows
        .map((r) =>
          JSON.stringify({
            id: r.id,
            code: r.code,
            title: r.title,
            batch: r.batch,
            file: r.file_name,
            url: fileUrl(r.id),
            pages: r.page_count,
            annotations: r.annotations.map((a) => ({
              label: a.label,
              page: a.page,
              bbox: [a.x, a.y, a.width, a.height],
              note: a.note,
            })),
          }),
        )
        .join('\n');
    }

    const labels = await this.listLabels();
    const categoryId = new Map(labels.map((l, i) => [l.id, i + 1]));
    const images: object[] = [];
    const annotations: object[] = [];
    const scale = 1000;
    for (const r of rows) {
      for (let page = 1; page <= r.page_count; page++) {
        const imageId = images.length + 1;
        images.push({
          id: imageId,
          file_name: `${r.code}${r.page_count > 1 ? `_p${page}` : ''}`,
          width: scale,
          height: scale,
          source_url: fileUrl(r.id),
          page,
        });
        for (const a of r.annotations.filter((x) => x.page === page)) {
          const bbox = [a.x, a.y, a.width, a.height].map(
            (v) => Math.round(v * scale * 100) / 100,
          );
          annotations.push({
            id: annotations.length + 1,
            image_id: imageId,
            category_id: categoryId.get(a.label_id),
            bbox,
            area: bbox[2] * bbox[3],
            iscrowd: 0,
            note: a.note,
          });
        }
      }
    }
    return JSON.stringify(
      {
        info: {
          description:
            'Dataset lỗi bản vẽ 4SigmaBrains (toạ độ theo thang 1000 x 1000 mỗi trang)',
          date_created: new Date().toISOString(),
        },
        categories: labels.map((l) => ({
          id: categoryId.get(l.id),
          name: l.name,
        })),
        images,
        annotations,
      },
      null,
      2,
    );
  }
}
