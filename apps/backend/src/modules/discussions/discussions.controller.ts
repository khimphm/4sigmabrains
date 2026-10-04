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

import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import {
  CreateDiscussionDto,
  ReplyDto,
  UpdateDiscussionDto,
} from './discussions.dto.js';
import { DiscussionsService } from './discussions.service.js';

@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussions: DiscussionsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.discussions.list(projectId);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateDiscussionDto) {
    return this.discussions.create(user, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.discussions.get(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiscussionDto,
  ) {
    return this.discussions.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.discussions.remove(user, id);
  }

  @Post(':id/replies')
  reply(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplyDto,
  ) {
    return this.discussions.reply(user, id, dto);
  }

  @Delete(':id/replies/:replyId')
  @HttpCode(204)
  removeReply(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('replyId', ParseUUIDPipe) replyId: string,
  ) {
    return this.discussions.removeReply(user, id, replyId);
  }
}
