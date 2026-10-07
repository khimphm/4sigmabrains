import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '../../config/configuration.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { User } from '../users/user.entity.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GithubStrategy } from './github.strategy.js';
import { GoogleStrategy } from './google.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { MicrosoftStrategy } from './microsoft.strategy.js';
import { UserSession } from './user-session.entity.js';

@Module({
  imports: [
    UsersModule,
    ProjectsModule,
    TypeOrmModule.forFeature([User, UserSession]),
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('auth.jwtSecret', { infer: true }),
        signOptions: {
          expiresIn: config.get('auth.jwtExpiresInSeconds', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    MicrosoftStrategy,
    GithubStrategy,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
