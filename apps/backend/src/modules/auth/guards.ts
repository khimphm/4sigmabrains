import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import {
  ALLOW_PENDING,
  CLIENT_ACCESS,
  IS_PUBLIC,
  ROLES,
} from '../../common/decorators.js';
import type { AppConfig } from '../../config/configuration.js';
import { User, UserRole, UserStatus } from '../users/user.entity.js';
import { OAUTH_PROVIDERS, type OAuthProvider } from './auth.constants.js';

// Áp dụng cho mọi route: yêu cầu đăng nhập, trừ route gắn @Public().
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }
}

// Yêu cầu tài khoản đã được duyệt và đúng vai trò (nếu route có @Roles()).
// Tài khoản khách hàng chỉ vào được route gắn @ClientAccess().
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets))
      return true;

    const user = context.switchToHttp().getRequest<{ user?: User }>().user;
    if (!user) return false;
    if (
      user.status !== UserStatus.Active &&
      !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING, targets)
    ) {
      throw new ForbiddenException('Tài khoản chưa được duyệt');
    }
    if (
      user.role === UserRole.Client &&
      !this.reflector.getAllAndOverride<boolean>(CLIENT_ACCESS, targets)
    ) {
      throw new ForbiddenException(
        'Tài khoản khách hàng không truy cập được mục này',
      );
    }

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES,
      targets,
    );
    if (roles?.length && !roles.includes(user.role))
      throw new ForbiddenException('Bạn không có quyền này');
    return true;
  }
}

const providerGuards = Object.fromEntries(
  OAUTH_PROVIDERS.map((p) => [p, new (AuthGuard(p))()]),
) as unknown as Record<OAuthProvider, CanActivate>;

// /auth/:provider và /auth/:provider/callback, chỉ khi cách đăng nhập đó đã được cấu hình
@Injectable()
export class OAuthProviderGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext) {
    const provider = context.switchToHttp().getRequest<Request>().params
      .provider as OAuthProvider;
    if (!OAUTH_PROVIDERS.includes(provider)) throw new NotFoundException();
    if (!this.config.get('auth', { infer: true })[provider].enabled)
      throw new NotFoundException('Cách đăng nhập này chưa được bật');
    return providerGuards[provider].canActivate(context);
  }
}
