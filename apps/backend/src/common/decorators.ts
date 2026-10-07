import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '../modules/users/user.entity.js';

export const IS_PUBLIC = 'isPublic';
// Bỏ qua kiểm tra đăng nhập (trang đăng nhập Google, health check)
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ALLOW_PENDING = 'allowPending';
// Cho phép tài khoản đang chờ duyệt (vd: /auth/me để hiện màn hình chờ)
export const AllowPending = () => SetMetadata(ALLOW_PENDING, true);

export const ROLES = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

export const CLIENT_ACCESS = 'clientAccess';
// Cho phép tài khoản khách hàng (CLIENT) gọi route này; mặc định khách hàng bị chặn.
export const ClientAccess = () => SetMetadata(CLIENT_ACCESS, true);
