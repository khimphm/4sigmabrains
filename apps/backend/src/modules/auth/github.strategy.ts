import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { type Profile, Strategy } from 'passport-github2';

import type { AppConfig } from '../../config/configuration.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly auth: AuthService,
  ) {
    const github = config.get('auth.github', { infer: true });
    super({
      clientID: github.clientId,
      clientSecret: github.clientSecret,
      callbackURL: github.callbackUrl,
      scope: ['user:email'],
      passReqToCallback: true,
    });
  }

  validate(req: Request, _at: string, _rt: string, profile: Profile) {
    const emails = (profile.emails ?? []) as {
      value: string;
      primary?: boolean;
      verified?: boolean;
    }[];
    return this.auth.oauthLogin(
      'github',
      {
        id: profile.id,
        email:
          emails.find((e) => e.primary && e.verified !== false)?.value ??
          emails[0]?.value ??
          null,
        name: profile.displayName || profile.username || '',
        avatarUrl: profile.photos?.[0]?.value ?? null,
      },
      req,
    );
  }
}
