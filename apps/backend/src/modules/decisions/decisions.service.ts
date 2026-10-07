import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { type User, UserRole, UserStatus } from '../users/user.entity.js';
import {
  DecisionOpinion,
  OpinionAgree,
  OpinionKind,
} from './decision-opinion.entity.js';
import { Decision, DecisionStatus } from './decision.entity.js';
import type {
  CreateDecisionDto,
  DecideDto,
  DecisionQueryDto,
  OpinionDto,
  UpdateDecisionDto,
} from './decisions.dto.js';

const link = (id: string) => `/decisions/${id}`;

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(Decision)
    private readonly decisions: Repository<Decision>,
    @InjectRepository(DecisionOpinion)
    private readonly opinions: Repository<DecisionOpinion>,
    @InjectRepository(OpinionAgree)
    private readonly agrees: Repository<OpinionAgree>,
    private readonly db: DataSource,
    private readonly projects: ProjectsService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async list(query: DecisionQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.projectId) where.projectId = query.projectId;
    const items = await this.decisions.find({
      where,
      relations: { project: true },
      order: { status: 'ASC', updatedAt: 'DESC' },
    });
    if (!items.length) return [];
    const counts: { decision_id: string; opinions: string; people: string }[] =
      await this.db.query(
        `SELECT decision_id, count(*) AS opinions, count(DISTINCT author_id) AS people
           FROM decision_opinions WHERE decision_id = ANY($1) AND parent_id IS NULL
          GROUP BY decision_id`,
        [items.map((d) => d.id)],
      );
    const byId = new Map(counts.map((c) => [c.decision_id, c]));
    return items.map((d) => ({
      ...d,
      opinionCount: Number(byId.get(d.id)?.opinions ?? 0),
      participantCount: Number(byId.get(d.id)?.people ?? 0),
    }));
  }

  private async find(id: string) {
    const d = await this.decisions.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!d) throw new NotFoundException('Không tìm thấy chủ đề');
    return d;
  }

  // Chủ đề kèm toàn bộ ý kiến, số người đồng ý và bảng tổng hợp xếp hạng
  async get(user: User, id: string) {
    const d = await this.find(id);
    const opinions = await this.opinions.find({
      where: { decisionId: id },
      order: { createdAt: 'ASC' },
    });
    const agreeRows = opinions.length
      ? await this.agrees.find({
          where: { opinionId: In(opinions.map((o) => o.id)) },
          relations: { user: true },
        })
      : [];
    const agreeMap = new Map<string, { id: string; name: string }[]>();
    for (const a of agreeRows) {
      const list = agreeMap.get(a.opinionId) ?? [];
      list.push({ id: a.user.id, name: a.user.name });
      agreeMap.set(a.opinionId, list);
    }
    const enriched = opinions.map((o) => {
      const agreedBy = agreeMap.get(o.id) ?? [];
      return {
        ...o,
        agreeCount: agreedBy.length,
        agreedByMe: agreedBy.some((u) => u.id === user.id),
        agreedBy,
      };
    });
    const roots = enriched.filter((o) => !o.parentId);
    const summary = roots
      .filter((o) => o.kind !== OpinionKind.Question && o.agreeCount > 0)
      .sort((a, b) => b.agreeCount - a.agreeCount)
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        body: o.body,
        agreeCount: o.agreeCount,
        author: o.author.name,
      }));
    return {
      ...d,
      opinions: roots.map((o) => ({
        ...o,
        replies: enriched.filter((r) => r.parentId === o.id),
      })),
      summary,
      canDecide: await this.canDecide(user, d),
    };
  }

  // Quản trị, quản lý hoặc trưởng dự án của chủ đề mới được đóng dấu chốt
  private async canDecide(user: User, d: Decision) {
    if (isManager(user)) return true;
    return d.projectId ? this.projects.canEdit(user, d.projectId) : false;
  }

  private async participants(d: Decision) {
    const rows: { author_id: string }[] = await this.db.query(
      'SELECT DISTINCT author_id FROM decision_opinions WHERE decision_id = $1',
      [d.id],
    );
    return [d.ownerId, ...rows.map((r) => r.author_id)];
  }

  async create(user: User, dto: CreateDecisionDto) {
    const saved = await this.decisions.save(
      this.decisions.create({
        projectId: dto.projectId ?? null,
        title: dto.title,
        context: dto.context,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        ownerId: user.id,
      }),
    );
    await this.activity.log({
      actorId: user.id,
      entityType: 'decision',
      entityId: saved.id,
      projectId: saved.projectId,
      action: 'created',
      summary: saved.title,
    });
    // Mời cho ý kiến: thành viên dự án, hoặc cả công ty nếu là chủ đề chung
    const audience: { id: string }[] = saved.projectId
      ? await this.db.query(
          'SELECT user_id AS id FROM project_members WHERE project_id = $1',
          [saved.projectId],
        )
      : await this.db.query(
          `SELECT id FROM users WHERE status = $1 AND role <> $2`,
          [UserStatus.Active, UserRole.Client],
        );
    await this.notifications.notify(
      audience.map((u) => u.id),
      {
        type: NotificationType.DecisionCreated,
        title: `Cần ý kiến: ${saved.title}`,
        body: saved.dueDate
          ? `Hạn chốt ${saved.dueDate.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
          : `${user.name} mở chủ đề mới`,
        link: link(saved.id),
        actorId: user.id,
      },
    );
    return this.get(user, saved.id);
  }

  async update(user: User, id: string, dto: UpdateDecisionDto) {
    const d = await this.find(id);
    assertCan(d.ownerId === user.id || (await this.canDecide(user, d)));
    await this.decisions.update(id, {
      ...dto,
      dueDate:
        dto.dueDate === undefined
          ? undefined
          : dto.dueDate
            ? new Date(dto.dueDate)
            : null,
    });
    return this.get(user, id);
  }

  async remove(user: User, id: string) {
    const d = await this.find(id);
    assertCan(d.ownerId === user.id || isManager(user));
    await this.decisions.delete(id);
  }

  async addOpinion(user: User, id: string, dto: OpinionDto) {
    const d = await this.find(id);
    if (d.status !== DecisionStatus.Open)
      throw new BadRequestException('Chủ đề đã chốt, mở lại để góp ý tiếp');
    let parent: DecisionOpinion | null = null;
    if (dto.parentId) {
      parent = await this.opinions.findOneBy({
        id: dto.parentId,
        decisionId: id,
      });
      if (!parent) throw new BadRequestException('Ý kiến gốc không tồn tại');
    }
    const mentionIds = dto.mentionIds ?? [];
    await this.opinions.save(
      this.opinions.create({
        decisionId: id,
        // Trả lời luôn gắn vào ý kiến gốc (1 cấp)
        parentId: parent ? (parent.parentId ?? parent.id) : null,
        kind: parent ? OpinionKind.Opinion : (dto.kind ?? OpinionKind.Opinion),
        body: dto.body,
        mentionIds,
        authorId: user.id,
      }),
    );
    await this.decisions.update(id, { updatedAt: new Date() });
    const preview =
      dto.body.length > 200 ? `${dto.body.slice(0, 200)}…` : dto.body;
    await this.notifications.notify(mentionIds, {
      type: NotificationType.Mentioned,
      title: `${user.name} nhắc đến bạn trong "${d.title}"`,
      body: preview,
      link: link(id),
      actorId: user.id,
    });
    const others = (await this.participants(d)).filter(
      (u) => !mentionIds.includes(u),
    );
    await this.notifications.notify(parent ? [parent.authorId] : others, {
      type: NotificationType.DiscussionReply,
      title: parent
        ? `${user.name} trả lời ý kiến của bạn trong "${d.title}"`
        : `${user.name} góp ý trong "${d.title}"`,
      body: preview,
      link: link(id),
      actorId: user.id,
    });
    return this.get(user, id);
  }

  async removeOpinion(user: User, id: string, opinionId: string) {
    const o = await this.opinions.findOneBy({ id: opinionId, decisionId: id });
    if (!o) throw new NotFoundException();
    assertCan(o.authorId === user.id || isManager(user));
    await this.opinions.delete(opinionId);
    return this.get(user, id);
  }

  // Bấm "Đồng ý" lần nữa để bỏ
  async toggleAgree(user: User, id: string, opinionId: string) {
    const d = await this.find(id);
    if (d.status !== DecisionStatus.Open)
      throw new BadRequestException('Chủ đề đã chốt');
    const o = await this.opinions.findOneBy({ id: opinionId, decisionId: id });
    if (!o) throw new NotFoundException();
    const existing = await this.agrees.findOneBy({
      opinionId,
      userId: user.id,
    });
    if (existing) await this.agrees.delete({ opinionId, userId: user.id });
    else await this.agrees.insert({ opinionId, userId: user.id });
    return this.get(user, id);
  }

  async decide(user: User, id: string, dto: DecideDto) {
    const d = await this.find(id);
    assertCan(
      await this.canDecide(user, d),
      'Chỉ quản lý dự án và quản trị viên được chốt',
    );
    await this.decisions.update(id, {
      status: DecisionStatus.Decided,
      conclusion: dto.conclusion,
      decidedById: user.id,
      decidedAt: new Date(),
    });
    await this.activity.log({
      actorId: user.id,
      entityType: 'decision',
      entityId: id,
      projectId: d.projectId,
      action: 'decided',
      summary: d.title,
      meta: { conclusion: dto.conclusion.slice(0, 300) },
    });
    await this.notifications.notify(await this.participants(d), {
      type: NotificationType.DecisionMade,
      title: `Đã chốt: ${d.title}`,
      body: dto.conclusion,
      link: link(id),
      actorId: user.id,
    });
    return this.get(user, id);
  }

  async reopen(user: User, id: string) {
    const d = await this.find(id);
    assertCan(await this.canDecide(user, d));
    await this.decisions.update(id, {
      status: DecisionStatus.Open,
      decidedAt: null,
      decidedById: null,
    });
    await this.activity.log({
      actorId: user.id,
      entityType: 'decision',
      entityId: id,
      projectId: d.projectId,
      action: 'reopened',
      summary: d.title,
    });
    return this.get(user, id);
  }

  async cancel(user: User, id: string) {
    const d = await this.find(id);
    assertCan(d.ownerId === user.id || (await this.canDecide(user, d)));
    await this.decisions.update(id, { status: DecisionStatus.Cancelled });
    return this.get(user, id);
  }
}
