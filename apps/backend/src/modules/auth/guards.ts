import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { ALLOW_PENDING, IS_PUBLIC, ROLES } from '../../common/decorators.js';
import { User, UserRole, UserStatus } from '../users/user.entity.js';

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

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES,
      targets,
    );
    if (roles?.length && !roles.includes(user.role))
      throw new ForbiddenException('Bạn không có quyền này');
    return true;
  }
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
