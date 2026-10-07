import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '../../config/configuration.js';
import { DatasetController } from './dataset.controller.js';
import {
  Annotation,
  Drawing,
  DrawingBatch,
  LabelType,
} from './dataset.entities.js';
import { DatasetService } from './dataset.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabelType, DrawingBatch, Drawing, Annotation]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        limits: {
          fileSize:
            config.get('storage.maxUploadMb', { infer: true }) * 1024 * 1024,
        },
      }),
    }),
  ],
  controllers: [DatasetController],
  providers: [DatasetService],
})
export class DatasetModule {}
