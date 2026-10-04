import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Activity } from './activity.entity.js';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
