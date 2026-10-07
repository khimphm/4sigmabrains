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
  CreateDecisionDto,
  DecideDto,
  DecisionQueryDto,
  OpinionDto,
  UpdateDecisionDto,
} from './decisions.dto.js';
import { DecisionsService } from './decisions.service.js';

@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisions: DecisionsService) {}

  @Get()
  list(@Query() query: DecisionQueryDto) {
    return this.decisions.list(query);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateDecisionDto) {
    return this.decisions.create(user, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.get(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDecisionDto,
  ) {
    return this.decisions.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.remove(user, id);
  }

  @Post(':id/opinions')
  addOpinion(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpinionDto,
  ) {
    return this.decisions.addOpinion(user, id, dto);
  }

  @Delete(':id/opinions/:opinionId')
  removeOpinion(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('opinionId', ParseUUIDPipe) opinionId: string,
  ) {
    return this.decisions.removeOpinion(user, id, opinionId);
  }

  @Post(':id/opinions/:opinionId/agree')
  agree(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('opinionId', ParseUUIDPipe) opinionId: string,
  ) {
    return this.decisions.toggleAgree(user, id, opinionId);
  }

  @Post(':id/decide')
  decide(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideDto,
  ) {
    return this.decisions.decide(user, id, dto);
  }

  @Post(':id/reopen')
  reopen(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.reopen(user, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.cancel(user, id);
  }
}
