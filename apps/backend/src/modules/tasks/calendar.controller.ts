import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

import { Public } from '../../common/decorators.js';
import { UsersService } from '../users/users.service.js';

const icsDate = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const icsText = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

// Link lịch iCal cá nhân: Google Calendar / Outlook đăng ký link này để thấy hạn chót công việc.
// Bảo vệ bằng token bí mật trong URL (có thể tạo lại ở trang Hồ sơ).
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly users: UsersService,
    private readonly db: DataSource,
  ) {}

  @Get(':token')
  @Public()
  async feed(@Param('token') token: string, @Res() res: Response) {
    const user = await this.users.findByCalendarToken(
      token.replace(/\.ics$/, ''),
    );
    if (!user) throw new NotFoundException();
    const tasks: {
      id: string;
      number: number;
      title: string;
      due_date: Date;
      status: string;
      key: string;
      name: string;
      project_id: string;
    }[] = await this.db.query(
      `SELECT t.id, t.number, t.title, t.due_date, t.status, p.key, p.name, t.project_id
         FROM tasks t JOIN projects p ON p.id = t.project_id
        WHERE t.assignee_id = $1 AND t.due_date IS NOT NULL
          AND t.due_date > now() - interval '60 days'`,
      [user.id],
    );
    const web = process.env.WEB_URL ?? '';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//4SigmaBrains//Workspace//VI',
      'CALSCALE:GREGORIAN',
      `X-WR-CALNAME:${icsText(`4SigmaBrains – ${user.name}`)}`,
      'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
      ...tasks.flatMap((t) => {
        const due = new Date(t.due_date);
        const start = new Date(due.getTime() - 30 * 60_000);
        return [
          'BEGIN:VEVENT',
          `UID:${t.id}@4sigmabrains`,
          `DTSTAMP:${icsDate(new Date())}`,
          `DTSTART:${icsDate(start)}`,
          `DTEND:${icsDate(due)}`,
          `SUMMARY:${icsText(`${t.status === 'DONE' ? '✓ ' : ''}${t.key}-${t.number} ${t.title}`)}`,
          `DESCRIPTION:${icsText(`Dự án ${t.name}\n${web}/tasks/${t.id}`)}`,
          `URL:${web}/tasks/${t.id}`,
          'END:VEVENT',
        ];
      }),
      'END:VCALENDAR',
    ];
    res
      .type('text/calendar; charset=utf-8')
      .set('Cache-Control', 'private, max-age=600')
      .send(lines.join('\r\n'));
  }
}
