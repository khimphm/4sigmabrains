import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { assertCan, isManager } from '../../common/permissions.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User, UserStatus } from '../users/user.entity.js';
import { ProjectMember, ProjectRole } from './project-member.entity.js';
import { Project, ProjectStatus } from './project.entity.js';
import type {
  AddMembersDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './projects.dto.js';

export interface ProjectStats {
  total: number;
  done: number;
  overdue: number;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly members: Repository<ProjectMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly activity: ActivityService,
    private readonly notifications: NotificationsService,
  ) {}

  private async stats(
    projectIds: string[],
  ): Promise<Map<string, ProjectStats>> {
    if (!projectIds.length) return new Map();
    const rows: {
      project_id: string;
      total: string;
      done: string;
      overdue: string;
    }[] = await this.dataSource.query(
      `SELECT project_id,
              count(*) AS total,
              count(*) FILTER (WHERE status = 'DONE') AS done,
              count(*) FILTER (WHERE status <> 'DONE' AND due_date < now()) AS overdue
         FROM tasks WHERE project_id = ANY($1) GROUP BY project_id`,
      [projectIds],
    );
    return new Map(
      rows.map((r) => [
        r.project_id,
        {
          total: Number(r.total),
          done: Number(r.done),
          overdue: Number(r.overdue),
        },
      ]),
    );
  }

  async list(status?: ProjectStatus) {
    const projects = await this.projects.find({
      where: status ? { status } : {},
      relations: { members: true, owner: true, client: true },
      order: { updatedAt: 'DESC' },
    });
    const stats = await this.stats(projects.map((p) => p.id));
    return projects.map((p) => ({
      ...p,
      stats: stats.get(p.id) ?? { total: 0, done: 0, overdue: 0 },
    }));
  }

  async get(id: string) {
    const project = await this.projects.findOne({
      where: { id },
      relations: { members: true, owner: true, client: true },
    });
    if (!project) throw new NotFoundException('Không tìm thấy dự án');
    const stats = await this.stats([id]);
    return {
      ...project,
      stats: stats.get(id) ?? { total: 0, done: 0, overdue: 0 },
    };
  }

  async canEdit(user: User, projectId: string) {
    if (isManager(user)) return true;
    const m = await this.members.findOneBy({ projectId, userId: user.id });
    return m?.role === ProjectRole.Lead;
  }

  async create(user: User, dto: CreateProjectDto) {
    if (await this.projects.existsBy({ key: dto.key }))
      throw new ConflictException(`Mã dự án ${dto.key} đã được dùng`);
    const { memberIds = [], ...data } = dto;
    const project = await this.projects.save(
      this.projects.create({ ...data, ownerId: user.id }),
    );
    await this.members.save(
      this.members.create({
        projectId: project.id,
        userId: user.id,
        role: ProjectRole.Lead,
      }),
    );
    await this.addMembers(
      user,
      project.id,
      { userIds: memberIds.filter((id) => id !== user.id) },
      true,
    );
    await this.activity.log({
      actorId: user.id,
      entityType: 'project',
      entityId: project.id,
      projectId: project.id,
      action: 'created',
      summary: project.name,
    });
    return this.get(project.id);
  }

  async update(user: User, id: string, dto: UpdateProjectDto) {
    assertCan(
      await this.canEdit(user, id),
      'Chỉ trưởng dự án hoặc quản lý mới sửa được dự án',
    );
    const project = await this.get(id);
    const changes = Object.keys(dto);
    await this.projects.update(id, dto);
    await this.activity.log({
      actorId: user.id,
      entityType: 'project',
      entityId: id,
      projectId: id,
      action:
        dto.status && dto.status !== project.status
          ? 'status_changed'
          : 'updated',
      summary: project.name,
      meta: { changes, status: dto.status },
    });
    return this.get(id);
  }

  async remove(user: User, id: string) {
    assertCan(
      await this.canEdit(user, id),
      'Chỉ trưởng dự án hoặc quản lý mới xoá được dự án',
    );
    await this.projects.delete(id);
  }

  async addMembers(
    user: User,
    projectId: string,
    dto: AddMembersDto,
    skipCheck = false,
  ) {
    if (!skipCheck) assertCan(await this.canEdit(user, projectId));
    if (!dto.userIds.length) return [];
    const project = await this.projects.findOneByOrFail({ id: projectId });
    const valid = await this.users.findBy({
      id: In(dto.userIds),
      status: UserStatus.Active,
    });
    const existing = new Set(
      (await this.members.findBy({ projectId })).map((m) => m.userId),
    );
    const added = valid.filter((u) => !existing.has(u.id));
    await this.members.save(
      added.map((u) =>
        this.members.create({
          projectId,
          userId: u.id,
          role: dto.role ?? ProjectRole.Member,
        }),
      ),
    );
    await this.notifications.notify(
      added.map((u) => u.id),
      {
        type: NotificationType.ProjectAdded,
        title: `Bạn được thêm vào dự án ${project.name}`,
        link: `/projects/${projectId}`,
        actorId: user.id,
      },
    );
    return this.members.findBy({ projectId });
  }

  async updateMemberRole(
    user: User,
    projectId: string,
    userId: string,
    role: ProjectRole,
  ) {
    assertCan(await this.canEdit(user, projectId));
    await this.members.update({ projectId, userId }, { role });
    return this.members.findBy({ projectId });
  }

  async removeMember(user: User, projectId: string, userId: string) {
    assertCan(user.id === userId || (await this.canEdit(user, projectId)));
    await this.members.delete({ projectId, userId });
  }
}
