import { timingSafeEqual } from 'node:crypto';

import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '../../common/decorators.js';
import type { AppConfig } from '../../config/configuration.js';
import { RemindersService } from '../tasks/reminders.service.js';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly reminders: RemindersService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('health')
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  // Gọi định kỳ từ bên ngoài (GitHub Actions) để chạy nhắc deadline khi server ngủ trên gói miễn phí.
  @Post('cron/reminders')
  @Public()
  runReminders(@Headers('x-cron-secret') secret?: string) {
    const expected = this.config.get('cronSecret', { infer: true });
    const ok =
      !!expected &&
      !!secret &&
      secret.length === expected.length &&
      timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
    if (!ok) throw new ForbiddenException();
    return this.reminders.run();
  }
}
