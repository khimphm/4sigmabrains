import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';

import type { AppConfig } from '../config/configuration.js';
import type { User } from '../users/user.entity.js';
import { SESSION_COOKIE } from './auth.constants.js';
import { CurrentUser } from './current-user.decorator.js';
import { GoogleAuthGuard, JwtAuthGuard } from './guards.js';
import { OAuthErrorFilter } from './oauth-error.filter.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // Chuyển hướng sang trang đăng nhập Google
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  google() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @UseFilters(OAuthErrorFilter)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const token = await this.jwt.signAsync({ sub: user.id });
    const maxAge =
      this.config.get('auth.jwtExpiresInSeconds', { infer: true }) * 1000;

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('nodeEnv', { infer: true }) === 'production',
      maxAge,
      path: '/',
    });
    res.redirect(this.config.get('webUrl', { infer: true }));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    const { id, email, name, avatarUrl, role, status } = user;
    return { id, email, name, avatarUrl, role, status };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}
