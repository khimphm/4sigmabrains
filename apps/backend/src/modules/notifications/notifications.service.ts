import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { MailService } from '../mail/mail.service.js';
import { User, UserStatus } from '../users/user.entity.js';
import { Notification, NotificationType } from './notification.entity.js';
import { NotificationsGateway } from './notifications.gateway.js';

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  actorId?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly gateway: NotificationsGateway,
    private readonly mail: MailService,
  ) {}

  // Gửi cho danh sách người nhận, bỏ qua chính người thực hiện thao tác.
  async notify(userIds: (string | null | undefined)[], input: NotifyInput) {
    const ids = [
      ...new Set(
        userIds.filter((id): id is string => !!id && id !== input.actorId),
      ),
    ];
    if (!ids.length) return;

    const recipients = await this.users.findBy({
      id: In(ids),
      status: UserStatus.Active,
    });
    const saved = await this.notifications.save(
      recipients.map((u) =>
        this.notifications.create({
          userId: u.id,
          actorId: input.actorId ?? null,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          link: input.link ?? null,
        }),
      ),
    );

    const actor = input.actorId
      ? await this.users.findOneBy({ id: input.actorId })
      : null;
    // Tắt "thông báo trong web" chỉ tắt cửa sổ bật lên; hộp thư vẫn lưu
    const popup = new Set(
      recipients.filter((u) => u.webNotifications).map((u) => u.id),
    );
    for (const n of saved) {
      this.gateway.emitToUser(n.userId, 'notification', {
        ...n,
        actor,
        silent: !popup.has(n.userId),
      });
    }
    for (const u of recipients) {
      if (u.emailNotifications)
        this.mail.send(u.email, input.title, input.body ?? '', input.link);
    }
  }

  async notifyAdmins(input: NotifyInput) {
    const admins = await this.users.find({
      where: { role: In(['ADMIN']), status: UserStatus.Active },
      select: { id: true },
    });
    await this.notify(
      admins.map((a) => a.id),
      input,
    );
  }

  async list(userId: string, unreadOnly: boolean, limit = 50) {
    const where = unreadOnly ? { userId, readAt: IsNull() } : { userId };
    const [items, unread] = await Promise.all([
      this.notifications.find({
        where,
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.notifications.countBy({ userId, readAt: IsNull() }),
    ]);
    return { items, unread };
  }

  async markRead(userId: string, id: string) {
    await this.notifications.update({ id, userId }, { readAt: new Date() });
  }

  async markAllRead(userId: string) {
    await this.notifications.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
  }
}
