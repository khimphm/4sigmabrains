import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AppConfig } from '../../config/configuration.js';
import { UsersService } from '../users/users.service.js';
import { SESSION_COOKIE } from './auth.constants.js';
import { AuthService } from './auth.service.js';

interface JwtPayload {
  sub: string;
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly usersService: UsersService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req.cookies?.[SESSION_COOKIE] as string | undefined) ?? null,
      ]),
      secretOrKey: config.get('auth.jwtSecret', { infer: true }),
    });
  }

  // Phiên bị thu hồi (đăng xuất thiết bị, đổi mật khẩu) thì từ chối
  async validate(payload: JwtPayload) {
    const session = await this.auth.validateSession(payload);
    if (!session) throw new UnauthorizedException('Phiên đăng nhập đã hết');
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return Object.assign(user, { sessionId: session.id });
  }
}
