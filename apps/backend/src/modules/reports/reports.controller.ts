import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DataSource } from 'typeorm';

const n = (v: unknown) => Number(v ?? 0);
const rate = (onTime: number, late: number) =>
  onTime + late ? Math.round((onTime / (onTime + late)) * 100) : null;

// Báo cáo hiệu suất: đúng hạn / trễ hạn theo người, theo dự án, theo tuần
@Controller('reports')
export class ReportsController {
  constructor(private readonly db: DataSource) {}

  @Get()
  async overview(
    @Query('days') daysParam = '30',
    @Query('projectId') projectId?: string,
  ) {
    const days = Math.min(Math.max(Number(daysParam) || 30, 7), 365);
    if (projectId && !/^[0-9a-f-]{36}$/i.test(projectId))
      throw new BadRequestException('projectId không hợp lệ');
    const params: unknown[] = [days];
    let scope = '';
    if (projectId) {
      params.push(projectId);
      scope = `AND t.project_id = $2`;
    }
    // Truy vấn chỉ lọc theo dự án dùng $1
    const scope1 = projectId ? `AND t.project_id = $1` : '';
    const params1 = projectId ? [projectId] : [];
    const inRange = `t.completed_at > now() - make_interval(days => $1)`;

    const [[summary], members, projects, weekly, labels] = await Promise.all([
      this.db.query(
        `SELECT count(*) FILTER (WHERE t.status = 'DONE' AND ${inRange}) AS done,
                count(*) FILTER (WHERE t.status = 'DONE' AND ${inRange} AND t.completed_at <= t.due_date) AS on_time,
                count(*) FILTER (WHERE t.status = 'DONE' AND ${inRange} AND t.completed_at > t.due_date) AS late,
                count(*) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now()) AS overdue,
                count(*) FILTER (WHERE t.status <> 'DONE') AS open,
                count(*) FILTER (WHERE t.created_at > now() - make_interval(days => $1)) AS created
           FROM tasks t WHERE true ${scope}`,
        params,
      ),
      this.db.query(
        `SELECT u.id, u.name, u.avatar_url, u.title,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND ${inRange}) AS done,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND ${inRange} AND t.completed_at <= t.due_date) AS on_time,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND ${inRange} AND t.completed_at > t.due_date) AS late,
                count(t.id) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now()) AS overdue,
                count(t.id) FILTER (WHERE t.status <> 'DONE') AS open,
                coalesce(avg(extract(epoch FROM (t.completed_at - t.due_date)) / 3600)
                  FILTER (WHERE t.status = 'DONE' AND ${inRange} AND t.completed_at > t.due_date), 0) AS avg_late_hours
           FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id ${scope}
          WHERE u.status = 'ACTIVE' AND u.role <> 'CLIENT'
          GROUP BY u.id ORDER BY done DESC, u.name`,
        params,
      ),
      this.db.query(
        `SELECT p.id, p.name, p.key, p.color, p.due_date, c.name AS client_name,
                count(t.id) AS total,
                count(t.id) FILTER (WHERE t.status = 'DONE') AS done,
                count(t.id) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now()) AS overdue,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND t.completed_at <= t.due_date) AS on_time,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND t.completed_at > t.due_date) AS late
           FROM projects p
           LEFT JOIN clients c ON c.id = p.client_id
           LEFT JOIN tasks t ON t.project_id = p.id
          WHERE p.status <> 'ARCHIVED' ${projectId ? 'AND p.id = $1' : ''}
          GROUP BY p.id, c.name ORDER BY p.updated_at DESC`,
        params1,
      ),
      // 12 tuần gần nhất, tuần bắt đầu thứ Hai
      this.db.query(
        `SELECT to_char(w.week, 'YYYY-MM-DD') AS week,
                count(t.id) AS done,
                count(t.id) FILTER (WHERE t.completed_at <= t.due_date OR t.due_date IS NULL) AS on_time,
                count(t.id) FILTER (WHERE t.completed_at > t.due_date) AS late
           FROM generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') AS w(week)
           LEFT JOIN tasks t ON t.status = 'DONE' AND date_trunc('week', t.completed_at) = w.week ${scope1}
          GROUP BY w.week ORDER BY w.week`,
        params1,
      ),
      this.db.query(
        `SELECT l.label, count(*) AS total,
                count(*) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now()) AS overdue
           FROM tasks t, unnest(t.labels) AS l(label)
          WHERE true ${scope1}
          GROUP BY l.label ORDER BY total DESC LIMIT 12`,
        params1,
      ),
    ]);

    const onTime = n(summary.on_time);
    const late = n(summary.late);
    return {
      days,
      summary: {
        done: n(summary.done),
        onTime,
        late,
        overdue: n(summary.overdue),
        open: n(summary.open),
        created: n(summary.created),
        rate: rate(onTime, late),
      },
      members: members.map((r: Record<string, unknown>) => ({
        id: r.id,
        name: r.name,
        title: r.title,
        avatarUrl: r.avatar_url,
        done: n(r.done),
        onTime: n(r.on_time),
        late: n(r.late),
        overdue: n(r.overdue),
        open: n(r.open),
        avgLateHours: Math.round(n(r.avg_late_hours) * 10) / 10,
        rate: rate(n(r.on_time), n(r.late)),
      })),
      projects: projects.map((r: Record<string, unknown>) => ({
        id: r.id,
        name: r.name,
        key: r.key,
        color: r.color,
        dueDate: r.due_date,
        clientName: r.client_name,
        total: n(r.total),
        done: n(r.done),
        overdue: n(r.overdue),
        rate: rate(n(r.on_time), n(r.late)),
        progress: n(r.total) ? Math.round((n(r.done) / n(r.total)) * 100) : 0,
      })),
      weekly: weekly.map((r: Record<string, unknown>) => ({
        week: r.week,
        done: n(r.done),
        onTime: n(r.on_time),
        late: n(r.late),
      })),
      labels: labels.map((r: Record<string, unknown>) => ({
        label: r.label,
        total: n(r.total),
        overdue: n(r.overdue),
      })),
    };
  }
}
