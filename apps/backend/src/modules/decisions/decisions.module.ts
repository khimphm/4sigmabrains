import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsModule } from '../projects/projects.module.js';
import { DecisionOpinion, OpinionAgree } from './decision-opinion.entity.js';
import { Decision } from './decision.entity.js';
import { DecisionsController } from './decisions.controller.js';
import { DecisionsService } from './decisions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision, DecisionOpinion, OpinionAgree]),
    ProjectsModule,
  ],
  controllers: [DecisionsController],
  providers: [DecisionsService],
})
export class DecisionsModule {}
