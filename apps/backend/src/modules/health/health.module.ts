import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { TasksModule } from '../tasks/tasks.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule, TasksModule],
  controllers: [HealthController],
})
export class HealthModule {}
