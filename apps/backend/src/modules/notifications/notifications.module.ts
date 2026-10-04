import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity.js';
import { Notification } from './notification.entity.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { NotificationsService } from './notifications.service.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    JwtModule.register({}),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
