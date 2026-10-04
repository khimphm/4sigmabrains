import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: config.get('webUrl', { infer: true }),
    credentials: true,
  });
  app.enableShutdownHooks();

  // Chế độ 1 dịch vụ: backend phục vụ luôn bản build frontend (dùng trên Render)
  const staticDir = config.get('serveStaticDir', { infer: true });
  if (staticDir) {
    const root = resolve(staticDir);
    if (existsSync(join(root, 'index.html'))) {
      app.useStaticAssets(root, { index: false, maxAge: '1h' });
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (
          req.method !== 'GET' ||
          req.path.startsWith('/api') ||
          req.path.startsWith('/socket.io')
        )
          return next();
        res.sendFile(join(root, 'index.html'));
      });
      Logger.log(`Phục vụ giao diện từ ${root}`, 'Bootstrap');
    } else {
      Logger.warn(
        `Không thấy ${root}/index.html, bỏ qua phục vụ giao diện`,
        'Bootstrap',
      );
    }
  }

  await app.listen(config.get('port', { infer: true }));
}
await bootstrap();
