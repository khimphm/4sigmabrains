import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { Roles } from '../../common/decorators.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from './user.entity.js';
import { UpdateMemberDto, UpdateProfileDto } from './users.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() user: User, @Query('all') all?: string) {
    return this.users.list(all === 'true' && user.role === UserRole.Admin);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.get(id);
  }

  // Duyệt thành viên, đổi vai trò, khoá tài khoản
  @Patch(':id')
  @Roles(UserRole.Admin)
  update(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.users.updateMember(actor, id, dto);
  }
}
