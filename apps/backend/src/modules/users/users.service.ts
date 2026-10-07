import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User, UserRole, UserStatus } from './user.entity.js';
import type { UpdateMemberDto, UpdateProfileDto } from './users.dto.js';

const n = (v: unknown) => Number(v ?? 0);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly db: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  findById(id: string) {
    return this.users.findOneBy({ id });
  }

  async get(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async getWithClient(id: string) {
    const user = await this.users.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  // Thành viên nội bộ đang hoạt động (chọn người làm, @nhắc tên); admin xem được tất cả kể cả khách hàng.
  list(includeAll: boolean) {
    const qb = this.users
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.client', 'client')
      .orderBy('u.status', 'ASC')
      .addOrderBy('u.name', 'ASC');
    if (!includeAll)
      qb.where('u.status = :s AND u.role <> :c', {
        s: UserStatus.Active,
        c: UserRole.Client,
      });
    return qb.getMany();
  }

  // Trang hồ sơ: thông tin + số liệu làm việc + việc đang làm
  async profile(id: string) {
    const user = await this.getWithClient(id);
    const [stats] = await this.db.query(
      `SELECT
           count(*) FILTER (WHERE status = 'DONE' AND completed_at > now() - interval '30 days') AS done_30,
           count(*) FILTER (WHERE status = 'DONE' AND completed_at BETWEEN now() - interval '60 days' AND now() - interval '30 days') AS done_prev_30,
           count(*) FILTER (WHERE status = 'DONE' AND due_date IS NOT NULL AND completed_at > now() - interval '90 days' AND completed_at <= due_date) AS on_time,
           count(*) FILTER (WHERE status = 'DONE' AND due_date IS NOT NULL AND completed_at > now() - interval '90 days' AND completed_at > due_date) AS late,
           count(*) FILTER (WHERE status <> 'DONE') AS open,
           count(*) FILTER (WHERE status <> 'DONE' AND due_date < now()) AS overdue
         FROM tasks WHERE assignee_id = $1`,
      [id],
    );
    const openTasks = await this.db.query(
      `SELECT t.id, t.number, t.title, t.status, t.priority, t.due_date AS "dueDate",
              p.id AS "projectId", p.name AS "projectName", p.key AS "projectKey", p.color AS "projectColor"
         FROM tasks t JOIN projects p ON p.id = t.project_id
        WHERE t.assignee_id = $1 AND t.status <> 'DONE'
        ORDER BY t.due_date ASC NULLS LAST LIMIT 8`,
      [id],
    );
    const onTime = n(stats.on_time);
    const late = n(stats.late);
    return {
      user,
      stats: {
        done30: n(stats.done_30),
        donePrev30: n(stats.done_prev_30),
        onTime,
        late,
        onTimeRate:
          onTime + late ? Math.round((onTime / (onTime + late)) * 100) : null,
        open: n(stats.open),
        overdue: n(stats.overdue),
      },
      openTasks,
      projects: await this.db.query(
        `SELECT p.id, p.name, p.key, p.color, p.status, pm.role
           FROM project_members pm JOIN projects p ON p.id = pm.project_id
          WHERE pm.user_id = $1 AND p.status <> 'ARCHIVED'
          ORDER BY p.updated_at DESC`,
        [id],
      ),
    };
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    const patch = { ...dto };
    if (patch.skills)
      patch.skills = [
        ...new Set(patch.skills.map((s) => s.trim()).filter(Boolean)),
      ];
    await this.users.update(user.id, patch);
    return this.getWithClient(user.id);
  }

  async updateMember(actor: User, id: string, dto: UpdateMemberDto) {
    if (actor.id === id && (dto.role || dto.status))
      throw new BadRequestException(
        'Không thể tự đổi quyền hoặc trạng thái của chính mình',
      );
    const member = await this.get(id);
    const wasPending = member.status === UserStatus.Pending;
    const role = dto.role ?? member.role;
    if (role === UserRole.Client && !(dto.clientId ?? member.clientId))
      throw new BadRequestException('Tài khoản khách hàng cần chọn khách hàng');
    await this.users.update(id, {
      ...dto,
      // Chỉ tài khoản khách hàng mới gắn với khách hàng
      clientId:
        role === UserRole.Client ? (dto.clientId ?? member.clientId) : null,
    });
    const saved = await this.getWithClient(id);
    if (wasPending && saved.status === UserStatus.Active) {
      await this.notifications.notify([saved.id], {
        type: NotificationType.AccountApproved,
        title: 'Tài khoản của bạn đã được duyệt',
        body: 'Bạn đã có thể sử dụng không gian làm việc 4SigmaBrains.',
        link: '/',
        actorId: actor.id,
      });
    }
    return saved;
  }

  // Link lịch iCal cá nhân (thêm vào Google Calendar / Outlook)
  async calendarToken(user: User, regenerate = false) {
    const full = await this.users.findOneOrFail({
      where: { id: user.id },
      select: { id: true, calendarToken: true },
    });
    if (full.calendarToken && !regenerate) return full.calendarToken;
    const token = randomBytes(24).toString('base64url');
    await this.users.update(user.id, { calendarToken: token });
    return token;
  }

  findByCalendarToken(token: string) {
    return this.users.findOneBy({
      calendarToken: token,
      status: UserStatus.Active,
    });
  }
}
