import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsModule } from '../projects/projects.module.js';
import { User } from '../users/user.entity.js';
import { UsersModule } from '../users/users.module.js';
import { CalendarController } from './calendar.controller.js';
import { ChecklistItem } from './checklist-item.entity.js';
import { RemindersService } from './reminders.service.js';
import { TaskComment } from './task-comment.entity.js';
import { TaskWatcher } from './task-watcher.entity.js';
import { Task } from './task.entity.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      ChecklistItem,
      TaskComment,
      TaskWatcher,
      User,
    ]),
    ProjectsModule,
    UsersModule,
  ],
  controllers: [TasksController, CalendarController],
  providers: [TasksService, RemindersService],
  exports: [TasksService, RemindersService],
})
export class TasksModule {}
