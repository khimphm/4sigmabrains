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
} from '@nestjs/common';

import { Roles } from '../../common/decorators.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from '../users/user.entity.js';
import { CreateClientDto, UpdateClientDto } from './clients.dto.js';
import { ClientsService } from './clients.service.js';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list() {
    return this.clients.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.clients.get(id);
  }

  @Post()
  @Roles(UserRole.Admin, UserRole.Manager)
  create(@CurrentUser() user: User, @Body() dto: CreateClientDto) {
    return this.clients.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Manager)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clients.remove(id);
  }
}
