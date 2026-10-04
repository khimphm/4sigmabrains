import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import type { AppConfig } from '../../config/configuration.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly auth: AppConfig['auth'];

  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly usersService: UsersService,
  ) {
    const auth = config.get('auth', { infer: true });
    super({
      clientID: auth.googleClientId,
      clientSecret: auth.googleClientSecret,
      callbackURL: auth.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
    this.auth = auth;
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email =
      profile.emails?.find((e) => e.verified)?.value ??
      profile.emails?.[0]?.value;
    if (!email)
      throw new UnauthorizedException('Tài khoản Google không có email');

    const domain = email.split('@')[1]?.toLowerCase();
    const { allowedEmailDomains, adminEmails } = this.auth;
    if (allowedEmailDomains.length && !allowedEmailDomains.includes(domain)) {
      throw new UnauthorizedException('Email không thuộc tổ chức');
    }

    return this.usersService.upsertFromGoogle(
      {
        googleId: profile.id,
        email,
        name: profile.displayName || email,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      },
      adminEmails,
    );
  }
}
