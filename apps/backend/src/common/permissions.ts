import { ForbiddenException } from '@nestjs/common';

import { type User, UserRole } from '../modules/users/user.entity.js';

export const isManager = (u: User) =>
  u.role === UserRole.Admin || u.role === UserRole.Manager;

export function assertCan(
  allowed: boolean,
  message = 'Bạn không có quyền thực hiện thao tác này',
) {
  if (!allowed) throw new ForbiddenException(message);
}
