import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { User } from '../users/user.entity.js';
import { DiscussionReply } from './discussion-reply.entity.js';
import { Discussion } from './discussion.entity.js';
import type {
  CreateDiscussionDto,
  ReplyDto,
  UpdateDiscussionDto,
} from './discussions.dto.js';

const preview = (s: string) => (s.length > 200 ? `${s.slice(0, 200)}…` : s);

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectRepository(Discussion)
    private readonly discussions: Repository<Discussion>,
    @InjectRepository(DiscussionReply)
    private readonly replies: Repository<DiscussionReply>,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  // projectId = "general" để lấy thảo luận chung
  list(projectId?: string) {
    const where =
      projectId === 'general'
        ? { projectId: IsNull() }
        : projectId
          ? { projectId }
          : {};
    return this.discussions.find({
      where,
      relations: { project: true },
      order: { pinned: 'DESC', lastActivityAt: 'DESC' },
      take: 200,
    });
  }

  async get(id: string) {
    const discussion = await this.discussions.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!discussion) throw new NotFoundException('Không tìm thấy thảo luận');
    const replies = await this.replies.find({
      where: { discussionId: id },
      order: { createdAt: 'ASC' },
    });
    return { ...discussion, replies };
  }

  async create(user: User, dto: CreateDiscussionDto) {
    const mentionIds = dto.mentionIds ?? [];
    const saved = await this.discussions.save(
      this.discussions.create({
        ...dto,
        projectId: dto.projectId ?? null,
        mentionIds,
        authorId: user.id,
      }),
    );
    await this.notifications.notify(mentionIds, {
      type: NotificationType.Mentioned,
      title: `${user.name} nhắc đến bạn trong "${saved.title}"`,
      body: preview(dto.body),
      link: `/discussions/${saved.id}`,
      actorId: user.id,
    });
    await this.activity.log({
      actorId: user.id,
      entityType: 'discussion',
      entityId: saved.id,
      projectId: saved.projectId,
      action: 'created',
      summary: saved.title,
    });
    return this.get(saved.id);
  }

  async update(user: User, id: string, dto: UpdateDiscussionDto) {
    const d = await this.discussions.findOneBy({ id });
    if (!d) throw new NotFoundException();
    assertCan(d.authorId === user.id || isManager(user));
    await this.discussions.update(id, dto);
    return this.get(id);
  }

  async remove(user: User, id: string) {
    const d = await this.discussions.findOneBy({ id });
    if (!d) throw new NotFoundException();
    assertCan(d.authorId === user.id || isManager(user));
    await this.discussions.delete(id);
  }

  async reply(user: User, id: string, dto: ReplyDto) {
    const d = await this.discussions.findOneBy({ id });
    if (!d) throw new NotFoundException();
    const mentionIds = dto.mentionIds ?? [];
    const reply = await this.replies.save(
      this.replies.create({
        discussionId: id,
        authorId: user.id,
        body: dto.body,
        mentionIds,
      }),
    );
    await this.discussions.update(id, {
      replyCount: () => 'reply_count + 1',
      lastActivityAt: new Date(),
    });

    const link = `/discussions/${id}`;
    await this.notifications.notify(mentionIds, {
      type: NotificationType.Mentioned,
      title: `${user.name} nhắc đến bạn trong "${d.title}"`,
      body: preview(dto.body),
      link,
      actorId: user.id,
    });
    // Người đã tham gia thảo luận cũng nhận thông báo có trả lời mới
    const participants: { author_id: string }[] = await this.replies.query(
      'SELECT DISTINCT author_id FROM discussion_replies WHERE discussion_id = $1',
      [id],
    );
    await this.notifications.notify(
      [d.authorId, ...participants.map((p) => p.author_id)].filter(
        (uid) => !mentionIds.includes(uid),
      ),
      {
        type: NotificationType.DiscussionReply,
        title: `${user.name} trả lời "${d.title}"`,
        body: preview(dto.body),
        link,
        actorId: user.id,
      },
    );
    return this.replies.findOneByOrFail({ id: reply.id });
  }

  async removeReply(user: User, id: string, replyId: string) {
    const r = await this.replies.findOneBy({ id: replyId, discussionId: id });
    if (!r) throw new NotFoundException();
    assertCan(r.authorId === user.id || isManager(user));
    await this.replies.delete(replyId);
    await this.discussions.update(id, {
      replyCount: () => 'GREATEST(reply_count - 1, 0)',
    });
  }
}
