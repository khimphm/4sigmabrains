import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(@CurrentUser() user: User) {
    return this.dashboard.overview(user);
  }
}
