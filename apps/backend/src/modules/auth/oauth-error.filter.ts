import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { SESSION_COOKIE } from './auth.constants.js';

import type { AppConfig } from '../../config/configuration.js';

// Lỗi trong luồng OAuth (huỷ đăng nhập, sai domain...) thì quay về trang login kèm lý do.
@Catch()
export class OAuthErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthErrorFilter.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.warn(`Đăng nhập OAuth thất bại: ${String(exception)}`);
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();
    const message =
      exception instanceof HttpException ? exception.message : 'oauth';
    // Đang đăng nhập (liên kết thêm tài khoản) thì quay về trang Bảo mật của hồ sơ
    const linking = !!req.cookies?.[SESSION_COOKIE];
    const path = linking ? '/profile?tab=security&' : '/login?';
    res.redirect(
      `${this.config.get('webUrl', { infer: true })}${path}error=${encodeURIComponent(message)}`,
    );
  }
}
