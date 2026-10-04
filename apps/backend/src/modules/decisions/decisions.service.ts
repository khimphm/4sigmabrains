import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { type User, UserStatus } from '../users/user.entity.js';
import { DecisionOption } from './decision-option.entity.js';
import { DecisionVote } from './decision-vote.entity.js';
import { Decision, DecisionStatus } from './decision.entity.js';
import type {
  CreateDecisionDto,
  DecideDto,
  DecisionOptionDto,
  VoteDto,
} from './decisions.dto.js';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(Decision)
    private readonly decisions: Repository<Decision>,
    @InjectRepository(DecisionOption)
    private readonly options: Repository<DecisionOption>,
    @InjectRepository(DecisionVote)
    private readonly votes: Repository<DecisionVote>,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async list(status?: DecisionStatus) {
    const items = await this.decisions.find({
      where: status ? { status } : {},
      relations: { project: true, options: true, votes: true },
      order: { createdAt: 'DESC' },
    });
    return items.map(({ votes, ...d }) => ({ ...d, voteCount: votes.length }));
  }

  async get(id: string) {
    const decision = await this.decisions.findOne({
      where: { id },
      relations: { project: true, options: true, votes: true },
      order: { options: { position: 'ASC' } },
    });
    if (!decision) throw new NotFoundException('Không tìm thấy quyết định');
    return decision;
  }

  async create(user: User, dto: CreateDecisionDto) {
    const saved = await this.decisions.save(
      this.decisions.create({
        projectId: dto.projectId ?? null,
        title: dto.title,
        context: dto.context,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        ownerId: user.id,
        options: dto.options.map((o, i) => this.toOption(o, i)),
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
    // Mời mọi người cho ý kiến
    const everyone: { id: string }[] = await this.decisions.query(
      'SELECT id FROM users WHERE status = $1',
      [UserStatus.Active],
    );
    await this.notifications.notify(
      everyone.map((u) => u.id),
      {
        type: NotificationType.DecisionCreated,
        title: `Cần ý kiến: ${saved.title}`,
        body: `${user.name} mở một quyết định mới với ${dto.options.length} phương án.`,
        link: `/decisions/${saved.id}`,
        actorId: user.id,
      },
    );
    return this.get(saved.id);
  }

  private toOption(o: DecisionOptionDto, position: number) {
    return this.options.create({
      title: o.title,
      description: o.description ?? null,
      pros: (o.pros ?? []).filter(Boolean),
      cons: (o.cons ?? []).filter(Boolean),
      position,
    });
  }

  async addOption(user: User, id: string, dto: DecisionOptionDto) {
    const d = await this.get(id);
    if (d.status !== DecisionStatus.Open)
      throw new BadRequestException('Quyết định đã đóng');
    await this.options.save({
      ...this.toOption(dto, d.options.length),
      decisionId: id,
    });
    return this.get(id);
  }

  async vote(user: User, id: string, dto: VoteDto) {
    const d = await this.get(id);
    if (d.status !== DecisionStatus.Open)
      throw new BadRequestException('Quyết định đã đóng, không thể bình chọn');
    if (!d.options.some((o) => o.id === dto.optionId))
      throw new BadRequestException('Phương án không hợp lệ');
    await this.votes.upsert(
      {
        decisionId: id,
        userId: user.id,
        optionId: dto.optionId,
        comment: dto.comment ?? null,
      },
      ['decisionId', 'userId'],
    );
    return this.get(id);
  }

  async decide(user: User, id: string, dto: DecideDto) {
    const d = await this.get(id);
    assertCan(
      d.ownerId === user.id || isManager(user),
      'Chỉ người tạo hoặc quản lý mới chốt được quyết định',
    );
    const option = d.options.find((o) => o.id === dto.optionId);
    if (!option) throw new BadRequestException('Phương án không hợp lệ');
    await this.decisions.update(id, {
      status: DecisionStatus.Decided,
      chosenOptionId: option.id,
      rationale: dto.rationale,
      decidedAt: new Date(),
    });
    await this.activity.log({
      actorId: user.id,
      entityType: 'decision',
      entityId: id,
      projectId: d.projectId,
      action: 'decided',
      summary: d.title,
      meta: { option: option.title },
    });
    const voters = d.votes.map((v) => v.userId);
    await this.notifications.notify([d.ownerId, ...voters], {
      type: NotificationType.DecisionMade,
      title: `Đã chốt: ${d.title}`,
      body: `Phương án được chọn: ${option.title}`,
      link: `/decisions/${id}`,
      actorId: user.id,
    });
    return this.get(id);
  }

  async cancel(user: User, id: string) {
    const d = await this.get(id);
    assertCan(d.ownerId === user.id || isManager(user));
    await this.decisions.update(id, { status: DecisionStatus.Cancelled });
    return this.get(id);
  }

  async reopen(user: User, id: string) {
    const d = await this.get(id);
    assertCan(d.ownerId === user.id || isManager(user));
    await this.decisions.update(id, {
      status: DecisionStatus.Open,
      chosenOptionId: null,
      decidedAt: null,
    });
    return this.get(id);
  }
}
