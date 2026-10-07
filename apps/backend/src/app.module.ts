import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { type AppConfig, configuration } from './config/configuration.js';
import { databaseOptions } from './database/database.options.js';
import { StorageModule } from './infrastructure/storage/storage.module.js';
import { ActivityModule } from './modules/activity/activity.module.js';
import { AttachmentsModule } from './modules/attachments/attachments.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AccessGuard, JwtAuthGuard } from './modules/auth/guards.js';
import { ClientsModule } from './modules/clients/clients.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { DatasetModule } from './modules/dataset/dataset.module.js';
import { DecisionsModule } from './modules/decisions/decisions.module.js';
import { DiscussionsModule } from './modules/discussions/discussions.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        ...databaseOptions(
          config.get('database.url', { infer: true }),
          config.get('database.ssl', { infer: true }),
        ),
        // Tự chạy migration khi khởi động
        migrationsRun: true,
      }),
    }),
    ScheduleModule.forRoot(),
    // Giới hạn 300 request/phút mỗi IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    // Hạ tầng & dịch vụ dùng chung
    StorageModule,
    MailModule,
    NotificationsModule,
    ActivityModule,
    // Nghiệp vụ
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    AttachmentsModule,
    DiscussionsModule,
    DecisionsModule,
    ClientsModule,
    DatasetModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
    SearchModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
})
export class AppModule {}
