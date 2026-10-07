import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import {
  AllowPending,
  ClientAccess,
  Public,
  Roles,
} from '../../common/decorators.js';
import type { AppConfig } from '../../config/configuration.js';
import { type User, UserRole } from '../users/user.entity.js';
import { InviteMemberDto } from '../users/users.dto.js';
import { UsersService } from '../users/users.service.js';
import { OAUTH_PROVIDERS, type OAuthProvider } from './auth.constants.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TotpCodeDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { OAuthProviderGuard } from './guards.js';
import { OAuthErrorFilter } from './oauth-error.filter.js';

type SessionUser = User & { sessionId: string };
// Chặn dò mật khẩu: tối đa 10 lần / phút / IP cho các route đăng nhập
const STRICT = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
@ClientAccess()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('providers')
  @Public()
  providers() {
    return this.auth.providers();
  }

  @Get('me')
  @AllowPending()
  me(@CurrentUser() user: User) {
    return this.users.getWithClient(user.id);
  }

  @Post('register')
  @Public()
  @Throttle(STRICT)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @Throttle(STRICT)
  login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    return this.auth.login(req, res, dto);
  }

  @Post('2fa/verify')
  @Public()
  @HttpCode(200)
  @Throttle(STRICT)
  verify2fa(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: TotpCodeDto,
  ) {
    return this.auth.verifySecondFactor(req, res, dto.code);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(204)
  @Throttle(STRICT)
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(204)
  @Throttle(STRICT)
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
  }

  @Post('logout')
  @Public()
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req, res);
  }

  // Quản trị viên mời thành viên hoặc khách hàng
  @Post('invite')
  @Roles(UserRole.Admin)
  invite(@CurrentUser() user: User, @Body() dto: InviteMemberDto) {
    return this.auth.invite(user, dto);
  }

  // --- Bảo mật tài khoản ---

  @Get('methods')
  methods(@CurrentUser() user: User) {
    return this.auth.loginMethods(user);
  }

  @Post('password')
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.auth.changePassword(user, dto);
  }

  @Delete('link/:provider')
  unlink(
    @CurrentUser() user: User,
    @Param('provider', new ParseEnumPipe(OAUTH_PROVIDERS))
    provider: OAuthProvider,
  ) {
    return this.auth.unlink(user, provider);
  }

  @Post('2fa/setup')
  setup2fa(@CurrentUser() user: User) {
    return this.auth.setupTotp(user);
  }

  @Post('2fa/enable')
  @HttpCode(204)
  async enable2fa(@CurrentUser() user: User, @Body() dto: TotpCodeDto) {
    await this.auth.enableTotp(user, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(204)
  async disable2fa(@CurrentUser() user: User, @Body() dto: TotpCodeDto) {
    await this.auth.disableTotp(user, dto.code);
  }

  @Get('sessions')
  async sessions(@CurrentUser() user: SessionUser) {
    const list = await this.auth.listSessions(user);
    return list.map((s) => ({ ...s, current: s.id === user.sessionId }));
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revoke(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.auth.revokeSession(user, id);
  }

  @Post('sessions/revoke-others')
  @HttpCode(204)
  async revokeOthers(@CurrentUser() user: SessionUser) {
    await this.auth.revokeOtherSessions(user, user.sessionId);
  }

  // --- Google / Microsoft / GitHub (đặt cuối vì là route có tham số) ---

  @Get(':provider')
  @Public()
  @UseGuards(OAuthProviderGuard)
  oauthStart() {}

  @Get(':provider/callback')
  @Public()
  @UseGuards(OAuthProviderGuard)
  @UseFilters(OAuthErrorFilter)
  async oauthCallback(
    @Param('provider') provider: OAuthProvider,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { user, linked } = req.user as { user: User; linked: boolean };
    const web = this.config.get('webUrl', { infer: true });
    if (linked)
      return res.redirect(`${web}/profile?tab=security&linked=${provider}`);
    const result = await this.auth.completeFirstFactor(
      req,
      res,
      user,
      provider,
    );
    res.redirect(result.totpRequired ? `${web}/login?step=2fa` : web);
  }
}
