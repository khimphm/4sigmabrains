import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import { StorageService } from '../../infrastructure/storage/storage.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { type User, UserRole } from '../users/user.entity.js';
import { Attachment, AttachmentTarget } from './attachment.entity.js';

export interface FileQuery {
  projectId?: string;
  q?: string;
  // pdf | image | cad | sheet | doc | other
  kind?: string;
  shared?: string;
  uploaderId?: string;
}

const KIND_SQL: Record<string, string> = {
  pdf: `a.mime_type = 'application/pdf' OR a.file_name ILIKE '%.pdf'`,
  image: `a.mime_type LIKE 'image/%'`,
  cad: `a.file_name ~* '\\.(dwg|dxf|rvt|ifc|skp)$'`,
  sheet: `a.file_name ~* '\\.(xlsx?|csv|ods)$'`,
  doc: `a.file_name ~* '\\.(docx?|odt|pptx?|txt|md)$'`,
};

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachments: Repository<Attachment>,
    private readonly storage: StorageService,
    private readonly db: DataSource,
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  list(targetType: AttachmentTarget, targetId: string) {
    return this.attachments.find({
      where: { targetType, targetId, isLatest: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Thư viện "Tệp và bản vẽ": mọi file (bản mới nhất), lọc theo dự án / loại / tên
  async library(query: FileQuery) {
    const where = ['a.is_latest'];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      where.push(sql.replace('?', `$${params.length}`));
    };
    if (query.projectId) add('a.project_id = ?', query.projectId);
    if (query.uploaderId) add('a.uploader_id = ?', query.uploaderId);
    if (query.q) add('a.file_name ILIKE ?', `%${query.q}%`);
    if (query.shared === 'true') where.push('a.shared_with_client');
    if (query.kind && KIND_SQL[query.kind])
      where.push(`(${KIND_SQL[query.kind]})`);
    if (query.kind === 'other')
      where.push(`NOT (${Object.values(KIND_SQL).join(' OR ')})`);
    return this.db.query(
      `SELECT a.id, a.file_name AS "fileName", a.mime_type AS "mimeType", a.size::int AS size,
              a.version, a.shared_with_client AS "sharedWithClient", a.created_at AS "createdAt",
              a.target_type AS "targetType", a.target_id AS "targetId",
              json_build_object('id', u.id, 'name', u.name, 'avatarUrl', u.avatar_url) AS uploader,
              CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('id', p.id, 'name', p.name, 'key', p.key, 'color', p.color) END AS project,
              CASE a.target_type
                WHEN 'TASK' THEN (SELECT json_build_object('id', t.id, 'label', p2.key || '-' || t.number, 'title', t.title)
                                    FROM tasks t JOIN projects p2 ON p2.id = t.project_id WHERE t.id = a.target_id)
                WHEN 'DISCUSSION' THEN (SELECT json_build_object('id', d.id, 'label', 'Thảo luận', 'title', d.title)
                                          FROM discussions d WHERE d.id = a.target_id)
                ELSE NULL END AS target
         FROM attachments a
         JOIN users u ON u.id = a.uploader_id
         LEFT JOIN projects p ON p.id = a.project_id
        WHERE ${where.join(' AND ')}
        ORDER BY a.created_at DESC
        LIMIT 500`,
      params,
    );
  }

  private async projectOf(targetType: AttachmentTarget, targetId: string) {
    if (targetType === AttachmentTarget.Project) return targetId;
    const table =
      targetType === AttachmentTarget.Task ? 'tasks' : 'discussions';
    const [row] = await this.db.query(
      `SELECT project_id FROM ${table} WHERE id = $1`,
      [targetId],
    );
    if (!row) throw new NotFoundException('Không tìm thấy nơi đính kèm');
    return (row.project_id as string | null) ?? null;
  }

  private async store(
    user: User,
    targetType: AttachmentTarget,
    targetId: string,
    file: Express.Multer.File | undefined,
    extra: Partial<Attachment> = {},
  ) {
    if (!file) throw new BadRequestException('Chưa chọn file');
    // Tên file tiếng Việt từ multer đến dưới dạng latin1
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const objectKey = await this.storage.upload(
      `${targetType.toLowerCase()}/${targetId}`,
      file.buffer,
      file.mimetype,
    );
    const saved = await this.attachments.save(
      this.attachments.create({
        targetType,
        targetId,
        projectId: await this.projectOf(targetType, targetId),
        fileName,
        mimeType: file.mimetype,
        size: file.size,
        objectKey,
        uploaderId: user.id,
        ...extra,
      }),
    );
    if (saved.projectId)
      await this.activity.log({
        actorId: user.id,
        entityType: 'file',
        entityId: saved.id,
        projectId: saved.projectId,
        action: saved.version > 1 ? 'new_version' : 'uploaded',
        summary: saved.fileName,
        meta: { version: saved.version },
      });
    return this.attachments.findOneByOrFail({ id: saved.id });
  }

  upload(
    user: User,
    targetType: AttachmentTarget,
    targetId: string,
    file: Express.Multer.File | undefined,
    shared = false,
  ) {
    return this.store(user, targetType, targetId, file, {
      sharedWithClient: shared,
    });
  }

  // Tải bản mới: giữ nguyên nơi đính kèm, tăng số phiên bản
  async uploadVersion(
    user: User,
    id: string,
    file: Express.Multer.File | undefined,
  ) {
    const current = await this.attachments.findOneBy({ id });
    if (!current) throw new NotFoundException('Không tìm thấy file');
    if (!current.isLatest)
      throw new BadRequestException('Chỉ tải bản mới từ phiên bản mới nhất');
    const saved = await this.store(
      user,
      current.targetType,
      current.targetId,
      file,
      {
        version: current.version + 1,
        previousId: current.id,
        sharedWithClient: current.sharedWithClient,
      },
    );
    await this.attachments.update(current.id, { isLatest: false });
    return saved;
  }

  async versions(id: string) {
    // Đi ngược về bản đầu tiên rồi lấy cả chuỗi
    const rows: { id: string }[] = await this.db.query(
      `WITH RECURSIVE up AS (
         SELECT id, previous_id FROM attachments WHERE id = $1
         UNION ALL SELECT a.id, a.previous_id FROM attachments a JOIN up ON a.id = up.previous_id
       ), down AS (
         SELECT id FROM up WHERE previous_id IS NULL
         UNION ALL SELECT a.id FROM attachments a JOIN down ON a.previous_id = down.id
       ) SELECT id FROM down`,
      [id],
    );
    if (!rows.length) throw new NotFoundException('Không tìm thấy file');
    const items = await this.attachments.findBy({
      id: In(rows.map((r) => r.id)),
    });
    return items.sort((a, b) => b.version - a.version);
  }

  async setShared(user: User, id: string, shared: boolean) {
    const file = await this.attachments.findOneBy({ id });
    if (!file) throw new NotFoundException('Không tìm thấy file');
    assertCan(
      file.uploaderId === user.id ||
        isManager(user) ||
        (!!file.projectId &&
          (await this.projects.canEdit(user, file.projectId))),
      'Chỉ người tải lên hoặc trưởng dự án được chia sẻ file cho khách hàng',
    );
    await this.attachments.update(id, { sharedWithClient: shared });
    if (shared && file.projectId) {
      const clients: { id: string; project: string }[] = await this.db.query(
        `SELECT u.id, p.name AS project FROM users u JOIN projects p ON p.client_id = u.client_id
          WHERE p.id = $1 AND u.role = $2`,
        [file.projectId, UserRole.Client],
      );
      await this.notifications.notify(
        clients.map((c) => c.id),
        {
          type: NotificationType.FileShared,
          title: `Tài liệu mới: ${file.fileName}`,
          body: clients[0] ? `Dự án ${clients[0].project}` : null,
          link: `/portal/projects/${file.projectId}`,
          actorId: user.id,
        },
      );
    }
    return this.attachments.findOneByOrFail({ id });
  }

  async open(id: string) {
    const attachment = await this.attachments.findOne({
      where: { id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        size: true,
        objectKey: true,
      },
    });
    if (!attachment) throw new NotFoundException('Không tìm thấy file');
    return {
      attachment,
      stream: await this.storage.download(attachment.objectKey),
    };
  }

  async remove(user: User, id: string) {
    const attachment = await this.attachments.findOne({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        objectKey: true,
        isLatest: true,
        previousId: true,
      },
    });
    if (!attachment) throw new NotFoundException('Không tìm thấy file');
    assertCan(attachment.uploaderId === user.id || isManager(user));
    await this.storage.remove(attachment.objectKey);
    await this.attachments.delete(id);
    // Xoá bản mới nhất thì bản trước đó trở thành bản hiện hành
    if (attachment.isLatest && attachment.previousId)
      await this.attachments.update(attachment.previousId, { isLatest: true });
  }
}
