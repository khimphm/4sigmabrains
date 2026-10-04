import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DecisionOption } from './decision-option.entity.js';
import { DecisionVote } from './decision-vote.entity.js';
import { Decision } from './decision.entity.js';
import { DecisionsController } from './decisions.controller.js';
import { DecisionsService } from './decisions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Decision, DecisionOption, DecisionVote])],
  controllers: [DecisionsController],
  providers: [DecisionsService],
})
export class DecisionsModule {}
