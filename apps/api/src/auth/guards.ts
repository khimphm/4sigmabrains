import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User, UserStatus } from '../users/user.entity.js';

// Yêu cầu đã đăng nhập (kể cả tài khoản đang chờ duyệt).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Yêu cầu tài khoản đã được duyệt. Dùng sau JwtAuthGuard.
@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: User }>().user;
    if (user?.status !== UserStatus.Active)
      throw new ForbiddenException('Tài khoản chưa được duyệt');
    return true;
  }
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
