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

import { Roles } from '../../common/decorators.js';
import { ActivityService } from '../activity/activity.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from '../users/user.entity.js';
import { ProjectStatus } from './project.entity.js';
import {
  AddMembersDto,
  CreateProjectDto,
  UpdateMemberRoleDto,
  UpdateProjectDto,
} from './projects.dto.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  list(@Query('status') status?: ProjectStatus) {
    return this.projects.list(status);
  }

  @Post()
  @Roles(UserRole.Admin, UserRole.Manager)
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projects.create(user, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.projects.get(id);
  }

  @Get(':id/activity')
  activityLog(@Param('id', ParseUUIDPipe) id: string) {
    return this.activity.forProject(id, 100);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.projects.remove(user, id);
  }

  @Post(':id/members')
  addMembers(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.projects.addMembers(user, id, dto);
  }

  @Patch(':id/members/:userId')
  updateMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.projects.updateMemberRole(user, id, userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @HttpCode(204)
  removeMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.projects.removeMember(user, id, userId);
  }
}
