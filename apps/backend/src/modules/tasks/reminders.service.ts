import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { Task } from './task.entity.js';

// Nhắc deadline: trước hạn 24 giờ và khi đã quá hạn. Mỗi công việc chỉ nhắc 1 lần cho mỗi loại.
// Chạy mỗi 10 phút khi server đang thức, và qua /api/cron/reminders (GitHub Actions gọi mỗi giờ).
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private running = false;

  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run() {
    if (this.running) return { dueSoon: 0, overdue: 0 };
    this.running = true;
    try {
      const [dueSoon] = await this.claim(
        `t.due_date BETWEEN now() AND now() + interval '24 hours' AND t.reminder_sent_at IS NULL`,
        'reminder_sent_at',
      );
      for (const t of dueSoon) {
        await this.notifications.notify([t.assignee_id], {
          type: NotificationType.TaskDueSoon,
          title: `Sắp đến hạn: ${t.key}-${t.number} ${t.title}`,
          body: `Hạn chót ${new Date(t.due_date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
          link: `/projects/${t.project_id}?task=${t.id}`,
        });
      }

      const [overdue] = await this.claim(
        `t.due_date < now() AND t.overdue_notified_at IS NULL`,
        'overdue_notified_at',
      );
      for (const t of overdue) {
        await this.notifications.notify([t.assignee_id, t.reporter_id], {
          type: NotificationType.TaskOverdue,
          title: `Quá hạn: ${t.key}-${t.number} ${t.title}`,
          body: `Đã quá hạn từ ${new Date(t.due_date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
          link: `/projects/${t.project_id}?task=${t.id}`,
        });
      }
      if (dueSoon.length || overdue.length) {
        this.logger.log(
          `Đã nhắc ${dueSoon.length} việc sắp đến hạn, ${overdue.length} việc quá hạn`,
        );
      }
      return { dueSoon: dueSoon.length, overdue: overdue.length };
    } finally {
      this.running = false;
    }
  }

  // Đánh dấu và lấy ra trong một câu lệnh để không nhắc trùng.
  private claim(
    condition: string,
    column: 'reminder_sent_at' | 'overdue_notified_at',
  ) {
    return this.tasks.query(
      `UPDATE tasks t SET ${column} = now()
         FROM projects p
        WHERE p.id = t.project_id AND t.status <> 'DONE' AND t.due_date IS NOT NULL AND ${condition}
        RETURNING t.id, t.number, t.title, t.due_date, t.assignee_id, t.reporter_id, t.project_id, p.key`,
    ) as Promise<
      [
        {
          id: string;
          number: number;
          title: string;
          due_date: string;
          assignee_id: string | null;
          reporter_id: string;
          project_id: string;
          key: string;
        }[],
        number,
      ]
    >;
  }
}
