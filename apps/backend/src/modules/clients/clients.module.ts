import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity.js';
import { Client } from './client.entity.js';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { PortalController } from './portal.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Client, User])],
  controllers: [ClientsController, PortalController],
  providers: [ClientsService],
})
export class ClientsModule {}
