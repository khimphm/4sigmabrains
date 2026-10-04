import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import { DecisionStatus } from './decision.entity.js';
import {
  CreateDecisionDto,
  DecideDto,
  DecisionOptionDto,
  VoteDto,
} from './decisions.dto.js';
import { DecisionsService } from './decisions.service.js';

@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisions: DecisionsService) {}

  @Get()
  list(@Query('status') status?: DecisionStatus) {
    return this.decisions.list(status);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateDecisionDto) {
    return this.decisions.create(user, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.get(id);
  }

  @Post(':id/options')
  addOption(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionOptionDto,
  ) {
    return this.decisions.addOption(user, id, dto);
  }

  @Post(':id/vote')
  vote(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoteDto,
  ) {
    return this.decisions.vote(user, id, dto);
  }

  @Post(':id/decide')
  decide(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideDto,
  ) {
    return this.decisions.decide(user, id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.cancel(user, id);
  }

  @Post(':id/reopen')
  reopen(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.decisions.reopen(user, id);
  }
}
