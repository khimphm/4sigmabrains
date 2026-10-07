import { BadRequestException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '../../config/configuration.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { Attachment } from './attachment.entity.js';
import { AttachmentsController } from './attachments.controller.js';
import { AttachmentsService } from './attachments.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    ProjectsModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        limits: {
          fileSize:
            config.get('storage.maxUploadMb', { infer: true }) * 1024 * 1024,
        },
        fileFilter: (_req, file, cb) =>
          file
            ? cb(null, true)
            : cb(new BadRequestException('Thiếu file'), false),
      }),
    }),
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
