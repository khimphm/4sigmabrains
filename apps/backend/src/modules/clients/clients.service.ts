import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ActivityService } from '../activity/activity.service.js';
import { User, UserRole } from '../users/user.entity.js';
import { Client } from './client.entity.js';
import type { CreateClientDto, UpdateClientDto } from './clients.dto.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly db: DataSource,
    private readonly activity: ActivityService,
  ) {}

  async list() {
    const clients = await this.clients.find({ order: { name: 'ASC' } });
    const counts: {
      client_id: string;
      projects: string;
      active: string;
      accounts: string;
    }[] = await this.db.query(
      `SELECT c.id AS client_id,
                (SELECT count(*) FROM projects p WHERE p.client_id = c.id) AS projects,
                (SELECT count(*) FROM projects p WHERE p.client_id = c.id AND p.status = 'ACTIVE') AS active,
                (SELECT count(*) FROM users u WHERE u.client_id = c.id) AS accounts
           FROM clients c`,
    );
    const byId = new Map(counts.map((c) => [c.client_id, c]));
    return clients.map((c) => ({
      ...c,
      projectCount: Number(byId.get(c.id)?.projects ?? 0),
      activeProjectCount: Number(byId.get(c.id)?.active ?? 0),
      accountCount: Number(byId.get(c.id)?.accounts ?? 0),
    }));
  }

  async get(id: string) {
    const client = await this.clients.findOneBy({ id });
    if (!client) throw new NotFoundException('Không tìm thấy khách hàng');
    const [projects, accounts] = await Promise.all([
      this.db.query(
        `SELECT p.id, p.name, p.key, p.color, p.status, p.due_date AS "dueDate",
                count(t.id)::int AS total, count(t.id) FILTER (WHERE t.status = 'DONE')::int AS done
           FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
          WHERE p.client_id = $1 GROUP BY p.id ORDER BY p.updated_at DESC`,
        [id],
      ),
      this.users.find({
        where: { clientId: id, role: UserRole.Client },
        order: { name: 'ASC' },
      }),
    ]);
    return { ...client, projects, accounts };
  }

  async create(user: User, dto: CreateClientDto) {
    const saved = await this.clients.save(this.clients.create(dto));
    await this.activity.log({
      actorId: user.id,
      entityType: 'client',
      entityId: saved.id,
      action: 'created',
      summary: saved.name,
    });
    return this.get(saved.id);
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.clients.update(id, dto);
    return this.get(id);
  }

  async remove(id: string) {
    await this.clients.delete(id);
  }
}
