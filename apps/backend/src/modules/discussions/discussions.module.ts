import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiscussionReply } from './discussion-reply.entity.js';
import { Discussion } from './discussion.entity.js';
import { DiscussionsController } from './discussions.controller.js';
import { DiscussionsService } from './discussions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Discussion, DiscussionReply])],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
})
export class DiscussionsModule {}
