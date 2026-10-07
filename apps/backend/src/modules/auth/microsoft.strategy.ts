import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { type MicrosoftProfile, Strategy } from 'passport-microsoft';

import type { AppConfig } from '../../config/configuration.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly auth: AuthService,
  ) {
    const ms = config.get('auth.microsoft', { infer: true });
    super({
      clientID: ms.clientId,
      clientSecret: ms.clientSecret,
      callbackURL: ms.callbackUrl,
      scope: ['user.read'],
      tenant: config.get('auth.microsoftTenant', { infer: true }),
      passReqToCallback: true,
    });
  }

  validate(req: Request, _at: string, _rt: string, profile: MicrosoftProfile) {
    return this.auth.oauthLogin(
      'microsoft',
      {
        id: profile.id,
        email:
          profile.emails?.[0]?.value ??
          profile._json?.mail ??
          profile._json?.userPrincipalName ??
          null,
        name: profile.displayName,
        avatarUrl: null,
      },
      req,
    );
  }
}
