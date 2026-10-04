import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { User } from '../users/user.entity.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<{ user: User }>().user,
);
