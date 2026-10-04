import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '../config/configuration.js';

// Hàng đợi việc nền (nhắc deadline, gửi email...). Module nghiệp vụ đăng ký queue riêng
// bằng BullModule.registerQueue({ name: '...' }).
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: { url: config.get('redis.url', { infer: true }) },
      }),
    }),
  ],
})
export class QueueModule {}
