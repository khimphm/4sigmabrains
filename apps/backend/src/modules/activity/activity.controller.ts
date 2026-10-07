import { Controller, Get, Query } from '@nestjs/common';

import { ActivityService } from './activity.service.js';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return projectId
      ? this.activity.forProject(projectId)
      : this.activity.recent(30);
  }
}
