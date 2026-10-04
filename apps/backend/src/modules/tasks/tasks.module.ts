import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsModule } from '../projects/projects.module.js';
import { ChecklistItem } from './checklist-item.entity.js';
import { RemindersService } from './reminders.service.js';
import { TaskComment } from './task-comment.entity.js';
import { Task } from './task.entity.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, ChecklistItem, TaskComment]),
    ProjectsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, RemindersService],
  exports: [TasksService, RemindersService],
})
export class TasksModule {}
