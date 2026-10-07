import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ClientAccess, Roles } from '../../common/decorators.js';
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
  @ClientAccess()
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user, dto);
  }

  @Get('me/calendar')
  async calendar(@CurrentUser() user: User) {
    return { token: await this.users.calendarToken(user) };
  }

  @Post('me/calendar')
  async regenerateCalendar(@CurrentUser() user: User) {
    return { token: await this.users.calendarToken(user, true) };
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.getWithClient(id);
  }

  @Get(':id/profile')
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.profile(id);
  }

  // Duyệt thành viên, đổi vai trò, khoá tài khoản, gắn khách hàng
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
