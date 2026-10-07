import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import type { User } from '../users/user.entity.js';
import { ChecklistItem } from './checklist-item.entity.js';
import { STATUS_LABEL } from './task-labels.js';
import { TaskComment } from './task-comment.entity.js';
import { TaskWatcher } from './task-watcher.entity.js';
import { Task, TaskStatus } from './task.entity.js';
import type {
  CommentDto,
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './tasks.dto.js';

const taskCode = (t: Task) => `${t.project?.key ?? ''}-${t.number}`;
const taskLink = (t: Task) => `/tasks/${t.id}`;

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(ChecklistItem)
    private readonly checklist: Repository<ChecklistItem>,
    @InjectRepository(TaskComment)
    private readonly comments: Repository<TaskComment>,
    @InjectRepository(TaskWatcher)
    private readonly watchers: Repository<TaskWatcher>,
    private readonly dataSource: DataSource,
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(user: User, query: TaskQueryDto) {
    const qb = this.tasks
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoin('t.project', 'project')
      .addSelect(['project.id', 'project.name', 'project.key', 'project.color'])
      .addSelect(
        (sq) =>
          sq
            .select('count(*)::int')
            .from(ChecklistItem, 'c')
            .where('c.task_id = t.id'),
        't_checklist_total',
      )
      .addSelect(
        (sq) =>
          sq
            .select('count(*)::int')
            .from(ChecklistItem, 'c')
            .where('c.task_id = t.id AND c.done = true'),
        't_checklist_done',
      )
      .addSelect(
        `(SELECT count(*)::int FROM attachments a WHERE a.target_type = 'TASK' AND a.target_id = t.id AND a.is_latest)`,
        't_attachment_count',
      )
      .addSelect(
        '(SELECT count(*)::int FROM task_comments tc WHERE tc.task_id = t.id)',
        't_comment_count',
      )
      .orderBy('t.position', 'ASC')
      .addOrderBy('t.createdAt', 'DESC');

    if (query.projectId)
      qb.andWhere('t.projectId = :projectId', { projectId: query.projectId });
    if (query.assigneeId) {
      qb.andWhere('t.assigneeId = :assigneeId', {
        assigneeId: query.assigneeId === 'me' ? user.id : query.assigneeId,
      });
    }
    if (query.status)
      qb.andWhere('t.status = :status', { status: query.status });
    if (query.includeDone === 'false') qb.andWhere(`t.status <> 'DONE'`);
    if (query.dueFrom)
      qb.andWhere('t.dueDate >= :dueFrom', { dueFrom: query.dueFrom });
    if (query.dueTo) qb.andWhere('t.dueDate <= :dueTo', { dueTo: query.dueTo });
    if (query.label)
      qb.andWhere(':label = ANY(t.labels)', { label: query.label });
    const tz = `'Asia/Ho_Chi_Minh'`;
    if (query.due === 'overdue')
      qb.andWhere(`t.status <> 'DONE' AND t.dueDate < now()`);
    else if (query.due === 'today')
      qb.andWhere(
        `(t.dueDate AT TIME ZONE ${tz})::date = (now() AT TIME ZONE ${tz})::date`,
      );
    else if (query.due === 'week')
      qb.andWhere(`t.dueDate BETWEEN now() AND now() + interval '7 days'`);
    else if (query.due === 'none') qb.andWhere('t.dueDate IS NULL');
    if (query.q) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('t.title ILIKE :q', { q: `%${query.q}%` })
            .orWhere('t.description ILIKE :q', { q: `%${query.q}%` }),
        ),
      );
    }
    const { entities, raw } = await qb.take(1000).getRawAndEntities();
    const counts = new Map(
      raw.map(
        (r: {
          t_id: string;
          t_checklist_total: number;
          t_checklist_done: number;
          t_attachment_count: number;
          t_comment_count: number;
        }) => [
          r.t_id,
          {
            checklistTotal: r.t_checklist_total,
            checklistDone: r.t_checklist_done,
            attachmentCount: r.t_attachment_count,
            commentCount: r.t_comment_count,
          },
        ],
      ),
    );
    return entities.map((t) => ({ ...t, ...counts.get(t.id) }));
  }

  // Chi tiết: kèm người theo dõi và trạng thái nhắc hạn tự động
  async detail(user: User, id: string) {
    const task = await this.get(id);
    const [watchers, [reminders]] = await Promise.all([
      this.watchers.find({
        where: { taskId: id },
        order: { createdAt: 'ASC' },
      }),
      this.dataSource.query(
        `SELECT reminder_sent_at AS "reminder24hSentAt", reminder_2h_sent_at AS "reminder2hSentAt",
                overdue_notified_at AS "overdueNotifiedAt"
           FROM tasks WHERE id = $1`,
        [id],
      ),
    ]);
    return {
      ...task,
      watchers: watchers.map((w) => w.user),
      watching: watchers.some((w) => w.userId === user.id),
      reminders,
    };
  }

  async watch(user: User, id: string, on: boolean) {
    await this.get(id);
    if (on) await this.addWatchers(id, [user.id]);
    else await this.watchers.delete({ taskId: id, userId: user.id });
    return this.detail(user, id);
  }

  private async addWatchers(taskId: string, userIds: (string | null)[]) {
    const ids = [...new Set(userIds.filter((u): u is string => !!u))];
    if (ids.length)
      await this.watchers.upsert(
        ids.map((userId) => ({ taskId, userId })),
        ['taskId', 'userId'],
      );
  }

  private async watcherIds(taskId: string) {
    return (await this.watchers.findBy({ taskId })).map((w) => w.userId);
  }

  async get(id: string) {
    const task = await this.tasks.findOne({
      where: { id },
      relations: {
        assignee: true,
        reporter: true,
        project: true,
        checklist: true,
      },
      order: { checklist: { position: 'ASC', createdAt: 'ASC' } },
    });
    if (!task) throw new NotFoundException('Không tìm thấy công việc');
    return task;
  }

  async create(user: User, dto: CreateTaskDto) {
    const project = await this.projects.get(dto.projectId);
    const { checklist = [], ...data } = dto;

    const task = await this.dataSource.transaction(async (em) => {
      const [[{ task_seq }]] = await em.query(
        'UPDATE projects SET task_seq = task_seq + 1 WHERE id = $1 RETURNING task_seq',
        [project.id],
      );
      const status = data.status ?? TaskStatus.Todo;
      const saved = await em.save(
        em.create(Task, {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status,
          number: task_seq,
          reporterId: user.id,
          position: Date.now(),
          completedAt: status === TaskStatus.Done ? new Date() : null,
        }),
      );
      if (checklist.length) {
        await em.save(
          checklist.map((content, i) =>
            em.create(ChecklistItem, {
              taskId: saved.id,
              content,
              position: i,
            }),
          ),
        );
      }
      return saved;
    });

    const full = await this.get(task.id);
    await this.addWatchers(full.id, [user.id, full.assigneeId]);
    await this.activity.log({
      actorId: user.id,
      entityType: 'task',
      entityId: task.id,
      projectId: project.id,
      action: 'created',
      summary: `${taskCode(full)} ${full.title}`,
    });
    if (full.assigneeId) await this.notifyAssigned(user, full);
    return full;
  }

  private notifyAssigned(actor: User, task: Task) {
    return this.notifications.notify([task.assigneeId], {
      type: NotificationType.TaskAssigned,
      title: `${actor.name} giao cho bạn: ${taskCode(task)} ${task.title}`,
      body: task.dueDate
        ? `Hạn chót: ${task.dueDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
        : null,
      link: taskLink(task),
      actorId: actor.id,
    });
  }

  async update(user: User, id: string, dto: UpdateTaskDto) {
    const before = await this.get(id);
    const patch: Partial<Task> = { ...dto, dueDate: undefined };
    if (dto.dueDate !== undefined) {
      patch.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      // Đổi hạn thì cho phép nhắc lại
      patch.reminderSentAt = null;
      patch.reminder2hSentAt = null;
      patch.overdueNotifiedAt = null;
    } else {
      delete patch.dueDate;
    }
    if (dto.status && dto.status !== before.status) {
      patch.completedAt = dto.status === TaskStatus.Done ? new Date() : null;
    }
    await this.tasks.update(id, patch);
    const after = await this.get(id);

    const changes = Object.keys(dto).filter(
      (k) =>
        JSON.stringify(dto[k as keyof UpdateTaskDto]) !==
        JSON.stringify(before[k as keyof Task]),
    );
    if (changes.length) {
      await this.activity.log({
        actorId: user.id,
        entityType: 'task',
        entityId: id,
        projectId: after.projectId,
        action: changes.includes('status')
          ? 'status_changed'
          : changes.includes('assigneeId')
            ? 'assigned'
            : 'updated',
        summary: `${taskCode(after)} ${after.title}`,
        meta: { changes, from: before.status, to: after.status },
      });
    }
    if (dto.assigneeId && dto.assigneeId !== before.assigneeId) {
      await this.addWatchers(id, [dto.assigneeId]);
      await this.notifyAssigned(user, after);
    }
    if (dto.status && dto.status !== before.status) {
      await this.notifications.notify(
        [after.reporterId, after.assigneeId, ...(await this.watcherIds(id))],
        {
          type: NotificationType.TaskStatusChanged,
          title: `${taskCode(after)} chuyển sang "${STATUS_LABEL[after.status]}"`,
          body: after.title,
          link: taskLink(after),
          actorId: user.id,
        },
      );
    }
    return after;
  }

  move(user: User, id: string, dto: MoveTaskDto) {
    return this.tasks
      .update(id, { position: dto.position })
      .then(() => this.update(user, id, { status: dto.status }));
  }

  async remove(user: User, id: string) {
    const task = await this.get(id);
    assertCan(
      task.reporterId === user.id ||
        isManager(user) ||
        (await this.projects.canEdit(user, task.projectId)),
    );
    await this.tasks.delete(id);
    await this.activity.log({
      actorId: user.id,
      entityType: 'task',
      entityId: id,
      projectId: task.projectId,
      action: 'deleted',
      summary: `${taskCode(task)} ${task.title}`,
    });
  }

  // --- Checklist ---
  async addChecklistItem(taskId: string, content: string) {
    await this.get(taskId);
    return this.checklist.save(
      this.checklist.create({ taskId, content, position: Date.now() }),
    );
  }

  async updateChecklistItem(
    user: User,
    taskId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    await this.checklist.update(
      { id: itemId, taskId },
      {
        ...dto,
        // Ghi lại ai tick xong, lúc nào
        ...(dto.done === undefined
          ? {}
          : dto.done
            ? { completedById: user.id, completedAt: new Date() }
            : { completedById: null, completedAt: null }),
      },
    );
    return this.checklist.findOneByOrFail({ id: itemId });
  }

  removeChecklistItem(taskId: string, itemId: string) {
    return this.checklist.delete({ id: itemId, taskId });
  }

  // --- Bình luận ---
  listComments(taskId: string) {
    return this.comments.find({
      where: { taskId },
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(user: User, taskId: string, dto: CommentDto) {
    const task = await this.get(taskId);
    const mentionIds = dto.mentionIds ?? [];
    const comment = await this.comments.save(
      this.comments.create({
        taskId,
        authorId: user.id,
        body: dto.body,
        mentionIds,
      }),
    );
    const preview =
      dto.body.length > 200 ? `${dto.body.slice(0, 200)}…` : dto.body;
    await this.notifications.notify(mentionIds, {
      type: NotificationType.Mentioned,
      title: `${user.name} nhắc đến bạn trong ${taskCode(task)}`,
      body: preview,
      link: taskLink(task),
      actorId: user.id,
    });
    await this.addWatchers(taskId, [user.id]);
    await this.notifications.notify(
      [
        task.assigneeId,
        task.reporterId,
        ...(await this.watcherIds(taskId)),
      ].filter((id) => id && !mentionIds.includes(id)),
      {
        type: NotificationType.TaskCommented,
        title: `${user.name} bình luận trong ${taskCode(task)}`,
        body: preview,
        link: taskLink(task),
        actorId: user.id,
      },
    );
    await this.activity.log({
      actorId: user.id,
      entityType: 'task',
      entityId: taskId,
      projectId: task.projectId,
      action: 'commented',
      summary: `${taskCode(task)} ${task.title}`,
    });
    return this.comments.findOneByOrFail({ id: comment.id });
  }

  async removeComment(user: User, taskId: string, commentId: string) {
    const comment = await this.comments.findOneBy({ id: commentId, taskId });
    if (!comment) throw new NotFoundException();
    assertCan(comment.authorId === user.id || isManager(user));
    await this.comments.delete(commentId);
  }
}
