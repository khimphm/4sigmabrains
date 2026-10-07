import { Controller, Get, Query } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Tìm nhanh cho bảng lệnh ⌘K
@Controller('search')
export class SearchController {
  constructor(private readonly db: DataSource) {}

  @Get()
  async search(@Query('q') q = '') {
    const term = q.trim();
    if (term.length < 2)
      return {
        projects: [],
        tasks: [],
        users: [],
        discussions: [],
        decisions: [],
        files: [],
        clients: [],
      };
    const like = `%${term}%`;
    const [projects, tasks, users, discussions, decisions, files, clients] =
      await Promise.all([
        this.db.query(
          `SELECT id, name, key, color FROM projects WHERE name ILIKE $1 OR key ILIKE $1 ORDER BY updated_at DESC LIMIT 5`,
          [like],
        ),
        this.db.query(
          `SELECT t.id, t.title, t.number, t.status, t.project_id AS "projectId", p.key
           FROM tasks t JOIN projects p ON p.id = t.project_id
          WHERE t.title ILIKE $1 OR (p.key || '-' || t.number) ILIKE $1
          ORDER BY t.updated_at DESC LIMIT 8`,
          [like],
        ),
        this.db.query(
          `SELECT id, name, email, avatar_url AS "avatarUrl" FROM users
          WHERE status = 'ACTIVE' AND role <> 'CLIENT' AND (name ILIKE $1 OR email ILIKE $1) ORDER BY name LIMIT 5`,
          [like],
        ),
        this.db.query(
          `SELECT id, title FROM discussions WHERE title ILIKE $1 OR body ILIKE $1 ORDER BY last_activity_at DESC LIMIT 5`,
          [like],
        ),
        this.db.query(
          `SELECT id, title, status FROM decisions WHERE title ILIKE $1 OR conclusion ILIKE $1 ORDER BY created_at DESC LIMIT 5`,
          [like],
        ),
        this.db.query(
          `SELECT a.id, a.file_name AS "fileName", a.mime_type AS "mimeType", a.project_id AS "projectId", p.key
           FROM attachments a LEFT JOIN projects p ON p.id = a.project_id
          WHERE a.is_latest AND a.file_name ILIKE $1 ORDER BY a.created_at DESC LIMIT 5`,
          [like],
        ),
        this.db.query(
          `SELECT id, name FROM clients WHERE name ILIKE $1 OR contact_name ILIKE $1 ORDER BY name LIMIT 5`,
          [like],
        ),
      ]);
    return { projects, tasks, users, discussions, decisions, files, clients };
  }
}
