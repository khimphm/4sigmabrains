import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ActivityService } from '../activity/activity.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import {
  ChecklistItemDto,
  CommentDto,
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './tasks.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: TaskQueryDto) {
    return this.tasks.list(user, query);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.get(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user, id, dto);
  }

  // Kéo thả trên Kanban
  @Post(':id/move')
  move(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasks.move(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.remove(user, id);
  }

  @Get(':id/activity')
  activityLog(@Param('id', ParseUUIDPipe) id: string) {
    return this.activity.forEntity('task', id);
  }

  @Post(':id/checklist')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChecklistItemDto,
  ) {
    return this.tasks.addChecklistItem(id, dto.content);
  }

  @Patch(':id/checklist/:itemId')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.tasks.updateChecklistItem(id, itemId, dto);
  }

  @Delete(':id/checklist/:itemId')
  @HttpCode(204)
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    await this.tasks.removeChecklistItem(id, itemId);
  }

  @Get(':id/comments')
  comments(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.listComments(id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommentDto,
  ) {
    return this.tasks.addComment(user, id, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  removeComment(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.tasks.removeComment(user, id, commentId);
  }
}
