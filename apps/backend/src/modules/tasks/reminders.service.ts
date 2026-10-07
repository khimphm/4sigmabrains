import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User } from '../users/user.entity.js';
import { Task } from './task.entity.js';

type Claimed = {
  id: string;
  number: number;
  title: string;
  due_date: string;
  assignee_id: string | null;
  reporter_id: string;
  project_id: string;
  key: string;
};

const fmt = (d: string) =>
  new Date(d).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

// Nhắc hạn tự động: trước hạn 24 giờ, trước 2 giờ, và khi quá hạn (báo cả người giao).
// Mỗi mốc chỉ nhắc 1 lần; đổi hạn chót thì được nhắc lại. Người dùng tắt được từng mốc.
// Chạy mỗi 10 phút khi server thức, và qua /api/cron/reminders (GitHub Actions gọi mỗi giờ).
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private running = false;

  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run() {
    if (this.running) return { dueSoon24h: 0, dueSoon2h: 0, overdue: 0 };
    this.running = true;
    try {
      // Mốc 2 giờ trước, rồi mới tới 24 giờ để việc sát hạn không nhận 2 nhắc cùng lúc
      const [due2h] = await this.claim(
        `t.due_date BETWEEN now() AND now() + interval '2 hours' AND t.reminder_2h_sent_at IS NULL`,
        'reminder_2h_sent_at',
        // Đã nhắc 2h thì coi như đã nhắc 24h
        ', reminder_sent_at = coalesce(t.reminder_sent_at, now())',
      );
      const [due24h] = await this.claim(
        `t.due_date BETWEEN now() + interval '2 hours' AND now() + interval '24 hours' AND t.reminder_sent_at IS NULL`,
        'reminder_sent_at',
      );
      const [overdue] = await this.claim(
        `t.due_date < now() AND t.overdue_notified_at IS NULL`,
        'overdue_notified_at',
      );

      const prefs = await this.prefs(
        [...due2h, ...due24h].map((t) => t.assignee_id),
      );
      for (const t of due2h) {
        if (!t.assignee_id || !prefs.get(t.assignee_id)?.remind2h) continue;
        await this.notifications.notify([t.assignee_id], {
          type: NotificationType.TaskDueSoon,
          title: `Còn dưới 2 giờ: ${t.key}-${t.number} ${t.title}`,
          body: `Hạn chót ${fmt(t.due_date)}`,
          link: `/tasks/${t.id}`,
        });
      }
      for (const t of due24h) {
        if (!t.assignee_id || !prefs.get(t.assignee_id)?.remind24h) continue;
        await this.notifications.notify([t.assignee_id], {
          type: NotificationType.TaskDueSoon,
          title: `Sắp đến hạn: ${t.key}-${t.number} ${t.title}`,
          body: `Hạn chót ${fmt(t.due_date)}`,
          link: `/tasks/${t.id}`,
        });
      }
      for (const t of overdue) {
        await this.notifications.notify([t.assignee_id, t.reporter_id], {
          type: NotificationType.TaskOverdue,
          title: `Quá hạn: ${t.key}-${t.number} ${t.title}`,
          body: `Đã quá hạn từ ${fmt(t.due_date)}`,
          link: `/tasks/${t.id}`,
        });
      }
      const result = {
        dueSoon24h: due24h.length,
        dueSoon2h: due2h.length,
        overdue: overdue.length,
      };
      if (due2h.length || due24h.length || overdue.length)
        this.logger.log(`Đã nhắc hạn: ${JSON.stringify(result)}`);
      return result;
    } finally {
      this.running = false;
    }
  }

  private async prefs(ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((i): i is string => !!i))];
    if (!unique.length) return new Map<string, User>();
    const users = await this.users.findBy({ id: In(unique) });
    return new Map(users.map((u) => [u.id, u]));
  }

  // Đánh dấu và lấy ra trong một câu lệnh để không nhắc trùng.
  private claim(
    condition: string,
    column: 'reminder_sent_at' | 'reminder_2h_sent_at' | 'overdue_notified_at',
    extraSet = '',
  ) {
    return this.tasks.query(
      `UPDATE tasks t SET ${column} = now()${extraSet}
         FROM projects p
        WHERE p.id = t.project_id AND t.status <> 'DONE' AND t.due_date IS NOT NULL AND ${condition}
        RETURNING t.id, t.number, t.title, t.due_date, t.assignee_id, t.reporter_id, t.project_id, p.key`,
    ) as Promise<[Claimed[], number]>;
  }
}
