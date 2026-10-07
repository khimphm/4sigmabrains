import { Body, Controller, Get, Patch } from '@nestjs/common';

import { Roles } from '../../common/decorators.js';
import { UserRole } from '../users/user.entity.js';
import { UpdateSettingsDto } from './settings.dto.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.all();
  }

  @Patch()
  @Roles(UserRole.Admin)
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
