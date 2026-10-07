import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Activity, EntityKind } from './activity.entity.js';

export interface LogInput {
  actorId: string | null;
  entityType: EntityKind;
  entityId: string;
  projectId?: string | null;
  action: string;
  summary: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
  ) {}

  log(input: LogInput) {
    return this.activities.save(
      this.activities.create({ projectId: null, meta: {}, ...input }),
    );
  }

  forEntity(entityType: EntityKind, entityId: string, limit = 50) {
    return this.activities.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  forProject(projectId: string, limit = 50) {
    return this.activities.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  recent(limit = 20) {
    return this.activities.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
