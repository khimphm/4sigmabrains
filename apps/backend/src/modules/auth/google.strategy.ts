import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';

import type { AppConfig } from '../../config/configuration.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly auth: AuthService,
  ) {
    const google = config.get('auth.google', { infer: true });
    super({
      clientID: google.clientId,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackUrl,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  validate(req: Request, _at: string, _rt: string, profile: Profile) {
    return this.auth.oauthLogin(
      'google',
      {
        id: profile.id,
        email:
          profile.emails?.find((e) => e.verified)?.value ??
          profile.emails?.[0]?.value ??
          null,
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      },
      req,
    );
  }
}
