import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import type { AppConfig } from '../../config/configuration.js';

// Lỗi trong luồng OAuth (huỷ đăng nhập, sai domain...) thì quay về trang login kèm lý do.
@Catch()
export class OAuthErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthErrorFilter.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.warn(`Đăng nhập OAuth thất bại: ${String(exception)}`);
    const res = host.switchToHttp().getResponse<Response>();
    const message =
      exception instanceof HttpException ? exception.message : 'oauth';
    res.redirect(
      `${this.config.get('webUrl', { infer: true })}/login?error=${encodeURIComponent(message)}`,
    );
  }
}
