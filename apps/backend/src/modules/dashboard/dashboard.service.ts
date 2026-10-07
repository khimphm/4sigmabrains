import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ActivityService } from '../activity/activity.service.js';
import type { User } from '../users/user.entity.js';

const n = (v: unknown) => Number(v ?? 0);

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DataSource,
    private readonly activity: ActivityService,
  ) {}

  async overview(user: User) {
    const tz = `'Asia/Ho_Chi_Minh'`;
    const [
      [me],
      [onTime],
      perUser,
      byStatus,
      projects,
      [decisions],
      recentActivity,
      today,
      [month],
      pending,
    ] = await Promise.all([
      this.db.query(
        `SELECT
           count(*) FILTER (WHERE status <> 'DONE') AS open,
           count(*) FILTER (WHERE status <> 'DONE' AND due_date < now()) AS overdue,
           count(*) FILTER (WHERE status <> 'DONE' AND (due_date AT TIME ZONE ${tz})::date = (now() AT TIME ZONE ${tz})::date) AS due_today,
           count(*) FILTER (WHERE status <> 'DONE' AND due_date BETWEEN now() AND now() + interval '7 days') AS due_week,
           count(*) FILTER (WHERE status <> 'DONE' AND (due_date AT TIME ZONE ${tz})::date > (now() AT TIME ZONE ${tz})::date
                              AND (due_date AT TIME ZONE ${tz})::date <= (now() AT TIME ZONE ${tz})::date + 3) AS due_soon,
           count(*) FILTER (WHERE status = 'DONE' AND completed_at > now() - interval '7 days') AS done_week
         FROM tasks WHERE assignee_id = $1`,
        [user.id],
      ),
      // Tỉ lệ hoàn thành đúng hạn trong 90 ngày, chỉ tính việc có hạn chót
      this.db.query(
        `SELECT count(*) FILTER (WHERE completed_at <= due_date) AS on_time,
                count(*) FILTER (WHERE completed_at > due_date) AS late
           FROM tasks
          WHERE status = 'DONE' AND due_date IS NOT NULL AND completed_at > now() - interval '90 days'`,
      ),
      this.db.query(
        `SELECT u.id, u.name, u.avatar_url,
                count(t.id) FILTER (WHERE t.status <> 'DONE') AS open,
                count(t.id) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now()) AS overdue,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND t.completed_at > now() - interval '90 days' AND t.completed_at <= t.due_date) AS on_time,
                count(t.id) FILTER (WHERE t.status = 'DONE' AND t.completed_at > now() - interval '90 days' AND t.completed_at > t.due_date) AS late
           FROM users u LEFT JOIN tasks t ON t.assignee_id = u.id
          WHERE u.status = 'ACTIVE' AND u.role <> 'CLIENT'
          GROUP BY u.id ORDER BY open DESC, u.name`,
      ),
      this.db.query(
        `SELECT status, count(*) AS count FROM tasks GROUP BY status`,
      ),
      this.db.query(
        `SELECT p.id, p.name, p.key, p.color, p.due_date, c.name AS client_name,
                (SELECT name FROM users WHERE id = p.owner_id) AS lead_name,
                count(t.id) AS total, count(t.id) FILTER (WHERE t.status = 'DONE') AS done,
                count(t.id) FILTER (WHERE t.status <> 'DONE' AND t.due_date < now()) AS overdue
           FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
           LEFT JOIN clients c ON c.id = p.client_id
          WHERE p.status = 'ACTIVE'
          GROUP BY p.id, c.name ORDER BY p.updated_at DESC LIMIT 6`,
      ),
      this.db.query(
        `SELECT count(*) AS open FROM decisions WHERE status = 'OPEN'`,
      ),
      this.activity.recent(15),
      // Việc hôm nay của tôi: quá hạn, đến hạn hôm nay, đã xong hôm nay
      this.db.query(
        `SELECT t.id, t.title, t.number, t.status, t.priority, t.due_date, t.completed_at, t.labels,
                p.id AS project_id, p.key, p.color, p.name AS project_name
           FROM tasks t JOIN projects p ON p.id = t.project_id
          WHERE t.assignee_id = $1 AND (
                (t.status <> 'DONE' AND (t.due_date AT TIME ZONE ${tz})::date <= (now() AT TIME ZONE ${tz})::date)
             OR (t.status = 'DONE' AND (t.completed_at AT TIME ZONE ${tz})::date = (now() AT TIME ZONE ${tz})::date))
          ORDER BY (t.status = 'DONE'), t.due_date NULLS LAST LIMIT 20`,
        [user.id],
      ),
      // Tỉ lệ đúng hạn tháng này (toàn công ty)
      this.db.query(
        `SELECT count(*) FILTER (WHERE completed_at <= due_date) AS on_time,
                count(*) FILTER (WHERE completed_at > due_date) AS late
           FROM tasks
          WHERE status = 'DONE' AND due_date IS NOT NULL
            AND completed_at >= date_trunc('month', now() AT TIME ZONE ${tz}) AT TIME ZONE ${tz}`,
      ),
      this.db.query(
        `SELECT d.id, d.title, d.due_date, p.name AS project_name, p.color,
                (SELECT count(*) FROM decision_opinions o WHERE o.decision_id = d.id) AS opinions
           FROM decisions d LEFT JOIN projects p ON p.id = d.project_id
          WHERE d.status = 'OPEN'
          ORDER BY d.due_date NULLS LAST, d.created_at DESC LIMIT 5`,
      ),
    ]);
    const monthOnTime = n(month.on_time);
    const monthLate = n(month.late);

    const onTimeCount = n(onTime.on_time);
    const lateCount = n(onTime.late);
    return {
      me: {
        open: n(me.open),
        overdue: n(me.overdue),
        dueToday: n(me.due_today),
        dueThisWeek: n(me.due_week),
        doneThisWeek: n(me.done_week),
        dueSoon: n(me.due_soon),
      },
      month: {
        onTime: monthOnTime,
        late: monthLate,
        rate:
          monthOnTime + monthLate
            ? Math.round((monthOnTime / (monthOnTime + monthLate)) * 100)
            : null,
      },
      today: today.map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.title,
        number: r.number,
        status: r.status,
        priority: r.priority,
        dueDate: r.due_date,
        completedAt: r.completed_at,
        labels: r.labels,
        project: {
          id: r.project_id,
          key: r.key,
          color: r.color,
          name: r.project_name,
        },
      })),
      pendingDecisions: pending.map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.title,
        dueDate: r.due_date,
        projectName: r.project_name,
        color: r.color,
        opinions: n(r.opinions),
      })),
      onTime: {
        onTime: onTimeCount,
        late: lateCount,
        rate:
          onTimeCount + lateCount
            ? Math.round((onTimeCount / (onTimeCount + lateCount)) * 100)
            : null,
      },
      members: perUser.map((r: Record<string, unknown>) => ({
        id: r.id,
        name: r.name,
        avatarUrl: r.avatar_url,
        open: n(r.open),
        overdue: n(r.overdue),
        onTime: n(r.on_time),
        late: n(r.late),
      })),
      byStatus: Object.fromEntries(
        byStatus.map((r: { status: string; count: string }) => [
          r.status,
          n(r.count),
        ]),
      ),
      projects: projects.map((r: Record<string, unknown>) => ({
        id: r.id,
        name: r.name,
        key: r.key,
        color: r.color,
        dueDate: r.due_date,
        clientName: r.client_name,
        leadName: r.lead_name,
        total: n(r.total),
        done: n(r.done),
        overdue: n(r.overdue),
      })),
      openDecisions: n(decisions.open),
      recentActivity,
    };
  }
}
