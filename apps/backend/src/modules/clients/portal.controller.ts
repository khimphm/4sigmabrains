import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

import { ClientAccess } from '../../common/decorators.js';
import { StorageService } from '../../infrastructure/storage/storage.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { type User, UserRole } from '../users/user.entity.js';

// Cổng khách hàng: chỉ đọc, chỉ dự án của khách hàng mà tài khoản thuộc về,
// chỉ file được đánh dấu chia sẻ. Không có bình luận, thảo luận nội bộ.
@Controller('portal')
@ClientAccess()
export class PortalController {
  constructor(
    private readonly db: DataSource,
    private readonly storage: StorageService,
  ) {}

  private clientId(user: User) {
    if (user.role !== UserRole.Client || !user.clientId)
      throw new ForbiddenException('Chỉ dành cho tài khoản khách hàng');
    return user.clientId;
  }

  private async project(user: User, id: string) {
    const [project] = await this.db.query(
      `SELECT p.id, p.name, p.key, p.color, p.status, p.description,
              p.start_date AS "startDate", p.due_date AS "dueDate",
              o.name AS "leadName", o.email AS "leadEmail"
         FROM projects p JOIN users o ON o.id = p.owner_id
        WHERE p.id = $1 AND p.client_id = $2`,
      [id, this.clientId(user)],
    );
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    return project;
  }

  @Get('overview')
  async overview(@CurrentUser() user: User) {
    const clientId = this.clientId(user);
    const [[client], projects, [company]] = await Promise.all([
      this.db.query('SELECT id, name FROM clients WHERE id = $1', [clientId]),
      this.db.query(
        `SELECT p.id, p.name, p.key, p.color, p.status, p.due_date AS "dueDate",
                count(t.id)::int AS total,
                count(t.id) FILTER (WHERE t.status = 'DONE')::int AS done,
                count(t.id) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now())::int AS overdue,
                max(t.completed_at) AS "lastCompletedAt",
                (SELECT json_build_object('title', n.title, 'dueDate', n.due_date)
                   FROM tasks n WHERE n.project_id = p.id AND n.status <> 'DONE' AND n.due_date >= now()
                  ORDER BY n.due_date LIMIT 1) AS "nextMilestone",
                (SELECT count(*)::int FROM attachments a
                  WHERE a.project_id = p.id AND a.shared_with_client AND a.is_latest) AS "sharedFiles"
           FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
          WHERE p.client_id = $1 AND p.status <> 'ARCHIVED'
          GROUP BY p.id ORDER BY p.status, p.updated_at DESC`,
        [clientId],
      ),
      // Thông tin liên hệ công ty để khách hàng biết gọi ai
      this.db.query(`SELECT value FROM settings WHERE key = 'company'`),
    ]);
    return { client, projects, company: company?.value ?? null };
  }

  @Get('projects/:id')
  async projectDetail(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const project = await this.project(user, id);
    const [tasks, files, milestones] = await Promise.all([
      this.db.query(
        `SELECT t.id, t.number, t.title, t.status, t.due_date AS "dueDate",
                t.completed_at AS "completedAt", u.name AS "assigneeName"
           FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
          WHERE t.project_id = $1
          ORDER BY (t.status = 'DONE'), t.due_date ASC NULLS LAST`,
        [id],
      ),
      this.db.query(
        `SELECT a.id, a.file_name AS "fileName", a.mime_type AS "mimeType", a.size::int AS size,
                a.version, a.created_at AS "createdAt", u.name AS "uploaderName"
           FROM attachments a JOIN users u ON u.id = a.uploader_id
          WHERE a.project_id = $1 AND a.shared_with_client AND a.is_latest
          ORDER BY a.created_at DESC`,
        [id],
      ),
      this.db.query(
        `SELECT t.number, t.title, t.completed_at AS "completedAt", t.due_date AS "dueDate"
           FROM tasks t WHERE t.project_id = $1 AND t.status = 'DONE'
          ORDER BY t.completed_at DESC LIMIT 10`,
        [id],
      ),
    ]);
    return { project, tasks, files, milestones };
  }

  @Get('files/:id')
  async download(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const [file] = await this.db.query(
      `SELECT a.object_key, a.file_name, a.mime_type, a.size
         FROM attachments a JOIN projects p ON p.id = a.project_id
        WHERE a.id = $1 AND a.shared_with_client AND p.client_id = $2`,
      [id, this.clientId(user)],
    );
    if (!file) throw new NotFoundException('Không tìm thấy file');
    res.set({
      'Content-Type': file.mime_type,
      'Content-Length': String(file.size),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
    });
    return new StreamableFile(await this.storage.download(file.object_key));
  }
}
