import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { IsNull, Not, Repository } from 'typeorm';

import type { AppConfig } from '../../config/configuration.js';
import { MailService } from '../mail/mail.service.js';
import { NotificationType } from '../notifications/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User, UserRole, UserStatus } from '../users/user.entity.js';
import {
  type LoginMethod,
  OAUTH_PROVIDERS,
  type OAuthProvider,
  PENDING_2FA_COOKIE,
  PROVIDER_COLUMN,
  PROVIDER_LABEL,
  SESSION_COOKIE,
} from './auth.constants.js';
import type { InviteMemberDto } from '../users/users.dto.js';
import { ProjectsService } from '../projects/projects.service.js';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.dto.js';
import { UserSession } from './user-session.entity.js';

export interface OAuthProfile {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

interface SessionPayload {
  sub: string;
  sid: string;
}

authenticator.options = { window: 1 };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly auth: AppConfig['auth'];
  private readonly isProd: boolean;
  private readonly webUrl: string;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessions: Repository<UserSession>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly projects: ProjectsService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.auth = config.get('auth', { infer: true });
    this.isProd = config.get('nodeEnv', { infer: true }) === 'production';
    this.webUrl = config.get('webUrl', { infer: true });
  }

  providers() {
    return {
      google: this.auth.google.enabled,
      microsoft: this.auth.microsoft.enabled,
      github: this.auth.github.enabled,
      password: true,
      emailEnabled: this.mail.enabled,
      allowedDomains: this.auth.allowedEmailDomains,
    };
  }

  // ---------- Phiên đăng nhập ----------

  private cookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.isProd,
      path: '/',
      ...(maxAge ? { maxAge } : {}),
    };
  }

  async issueSession(
    req: Request,
    res: Response,
    user: User,
    method: LoginMethod,
    remember = true,
  ) {
    const session = await this.sessions.save(
      this.sessions.create({
        userId: user.id,
        method,
        userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
        ip: req.ip ?? null,
      }),
    );
    await this.users.update(user.id, { lastLoginAt: new Date() });
    const token = await this.jwt.signAsync({ sub: user.id, sid: session.id });
    res.clearCookie(PENDING_2FA_COOKIE, { path: '/' });
    res.cookie(
      SESSION_COOKIE,
      token,
      this.cookieOptions(
        remember ? this.auth.jwtExpiresInSeconds * 1000 : undefined,
      ),
    );
  }

  // Phiên còn hiệu lực? Dùng cho JwtStrategy và khi liên kết tài khoản.
  async validateSession(payload: SessionPayload) {
    if (!payload.sid) return null;
    const session = await this.sessions.findOneBy({
      id: payload.sid,
      userId: payload.sub,
      revokedAt: IsNull(),
    });
    if (!session) return null;
    // Cập nhật "hoạt động lần cuối" thưa thôi để đỡ ghi DB
    if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000)
      await this.sessions.update(session.id, { lastSeenAt: new Date() });
    return session;
  }

  async userFromRequest(req: Request) {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token);
      if (!(await this.validateSession(payload))) return null;
      return this.users.findOneBy({ id: payload.sub });
    } catch {
      return null;
    }
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<SessionPayload>(token);
        if (payload.sid)
          await this.sessions.update(payload.sid, { revokedAt: new Date() });
      } catch {
        // phiên hỏng, chỉ cần xoá cookie
      }
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.clearCookie(PENDING_2FA_COOKIE, { path: '/' });
  }

  listSessions(user: User) {
    return this.sessions.find({
      where: { userId: user.id, revokedAt: IsNull() },
      order: { lastSeenAt: 'DESC' },
    });
  }

  async revokeSession(user: User, id: string) {
    await this.sessions.update(
      { id, userId: user.id },
      { revokedAt: new Date() },
    );
  }

  async revokeOtherSessions(user: User, currentSid: string) {
    await this.sessions.update(
      { userId: user.id, revokedAt: IsNull(), id: Not(currentSid) },
      { revokedAt: new Date() },
    );
  }

  // Sau bước 1: nếu bật 2FA thì chờ mã, ngược lại vào thẳng
  async completeFirstFactor(
    req: Request,
    res: Response,
    user: User,
    method: LoginMethod,
    remember = true,
  ) {
    if (user.totpEnabled) {
      const token = await this.jwt.signAsync(
        { sub: user.id, purpose: '2fa', method, remember },
        { expiresIn: 600 },
      );
      res.cookie(PENDING_2FA_COOKIE, token, this.cookieOptions(600_000));
      return { totpRequired: true as const };
    }
    await this.issueSession(req, res, user, method, remember);
    return { totpRequired: false as const, status: user.status };
  }

  async verifySecondFactor(req: Request, res: Response, code: string) {
    const token = req.cookies?.[PENDING_2FA_COOKIE] as string | undefined;
    let payload: {
      sub: string;
      purpose: string;
      method: LoginMethod;
      remember: boolean;
    };
    try {
      payload = await this.jwt.verifyAsync(token ?? '');
    } catch {
      throw new UnauthorizedException(
        'Phiên xác thực đã hết hạn, hãy đăng nhập lại',
      );
    }
    if (payload.purpose !== '2fa') throw new UnauthorizedException();
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, totpSecret: true, status: true, totpEnabled: true },
    });
    if (!user?.totpSecret || !authenticator.check(code, user.totpSecret))
      throw new UnauthorizedException('Mã xác thực không đúng');
    await this.issueSession(req, res, user, payload.method, payload.remember);
    return { status: user.status };
  }

  // ---------- Email + mật khẩu ----------

  private assertDomain(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();
    const { allowedEmailDomains } = this.auth;
    if (allowedEmailDomains.length && !allowedEmailDomains.includes(domain))
      throw new ForbiddenException(
        `Chỉ email thuộc ${allowedEmailDomains.join(', ')} được đăng nhập`,
      );
  }

  private async notifyPending(user: User, note?: string | null) {
    await this.notifications.notifyAdmins({
      type: NotificationType.MemberPending,
      title: `${user.name} đang chờ duyệt`,
      body: [user.email, note].filter(Boolean).join('\n'),
      link: '/admin/members',
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    this.assertDomain(email);
    if (await this.users.existsBy({ email }))
      throw new ConflictException(
        'Email đã có tài khoản. Hãy đăng nhập hoặc dùng "Quên mật khẩu".',
      );
    const isAdmin = this.auth.adminEmails.includes(email);
    const user = await this.users.save(
      this.users.create({
        email,
        name: dto.name.trim(),
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: isAdmin ? UserRole.Admin : UserRole.Member,
        status: isAdmin ? UserStatus.Active : UserStatus.Pending,
      }),
    );
    if (!isAdmin) await this.notifyPending(user, dto.note);
    return { status: user.status };
  }

  async login(req: Request, res: Response, dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        role: true,
        totpEnabled: true,
        passwordHash: true,
      },
    });
    // So sánh cả khi không có user để không lộ email nào tồn tại qua thời gian phản hồi
    const ok = await bcrypt.compare(
      dto.password,
      user?.passwordHash ??
        '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvali',
    );
    if (!user || !user.passwordHash || !ok)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    if (user.status === UserStatus.Disabled)
      throw new ForbiddenException('Tài khoản đã bị khoá');
    return this.completeFirstFactor(
      req,
      res,
      user,
      'password',
      dto.remember !== false,
    );
  }

  // Dấu vân tay mật khẩu: link đặt lại tự hết hiệu lực khi mật khẩu đổi
  private fingerprint(passwordHash: string | null) {
    return createHash('sha256')
      .update(passwordHash ?? 'no-password')
      .digest('hex')
      .slice(0, 16);
  }

  async passwordLink(user: Pick<User, 'id'>, ttlSeconds = 3600) {
    const full = await this.users.findOne({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });
    const token = await this.jwt.signAsync(
      {
        sub: user.id,
        purpose: 'reset',
        fp: this.fingerprint(full?.passwordHash ?? null),
      },
      { expiresIn: ttlSeconds },
    );
    return `/reset-password?token=${encodeURIComponent(token)}`;
  }

  async forgotPassword(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.users.findOneBy({ email });
    if (!user || user.status === UserStatus.Disabled) return;
    const link = await this.passwordLink(user);
    if (!this.mail.enabled) {
      this.logger.warn(
        `Chưa có SMTP. Link đặt lại mật khẩu cho ${email}: ${this.webUrl}${link}`,
      );
      return;
    }
    this.mail.send(
      email,
      'Đặt lại mật khẩu 4SigmaBrains',
      'Bấm nút bên dưới để đặt mật khẩu mới. Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.',
      link,
      'Đặt mật khẩu mới',
    );
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; purpose: string; fp: string };
    try {
      payload = await this.jwt.verifyAsync(dto.token);
    } catch {
      throw new BadRequestException('Link đã hết hạn hoặc không hợp lệ');
    }
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, passwordHash: true, status: true },
    });
    if (
      payload.purpose !== 'reset' ||
      !user ||
      this.fingerprint(user.passwordHash) !== payload.fp
    )
      throw new BadRequestException('Link đã được dùng hoặc không hợp lệ');
    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    // Đổi mật khẩu thì đăng xuất mọi thiết bị
    await this.sessions.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async changePassword(user: User, dto: ChangePasswordDto) {
    const full = await this.users.findOneOrFail({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });
    if (full.passwordHash) {
      if (
        !dto.currentPassword ||
        !(await bcrypt.compare(dto.currentPassword, full.passwordHash))
      )
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(dto.newPassword, 10),
    });
  }

  // ---------- Google / Microsoft / GitHub ----------

  async oauthLogin(
    provider: OAuthProvider,
    profile: OAuthProfile,
    req: Request,
  ) {
    const column = PROVIDER_COLUMN[provider];
    const current = await this.userFromRequest(req);

    // Đang đăng nhập: đây là thao tác liên kết thêm tài khoản
    if (current) {
      const owner = await this.users.findOneBy({ [column]: profile.id });
      if (owner && owner.id !== current.id)
        throw new ConflictException(
          `Tài khoản ${PROVIDER_LABEL[provider]} này đã liên kết với người khác`,
        );
      await this.users.update(current.id, { [column]: profile.id });
      return { user: current, linked: true };
    }

    let user = await this.users.findOneBy({ [column]: profile.id });
    const email = profile.email?.trim().toLowerCase() ?? null;
    if (!user && email) {
      user = await this.users.findOneBy({ email });
      if (user) await this.users.update(user.id, { [column]: profile.id });
    }

    if (!user) {
      if (!email)
        throw new UnauthorizedException(
          `Tài khoản ${PROVIDER_LABEL[provider]} không có email`,
        );
      this.assertDomain(email);
      const isAdmin = this.auth.adminEmails.includes(email);
      user = await this.users.save(
        this.users.create({
          email,
          name: profile.name || email,
          avatarUrl: profile.avatarUrl,
          [column]: profile.id,
          role: isAdmin ? UserRole.Admin : UserRole.Member,
          status: isAdmin ? UserStatus.Active : UserStatus.Pending,
        }),
      );
      if (!isAdmin) await this.notifyPending(user);
      return { user, linked: false };
    }

    if (user.status === UserStatus.Disabled)
      throw new ForbiddenException('Tài khoản đã bị khoá');
    if (!user.avatarUrl && profile.avatarUrl)
      await this.users.update(user.id, { avatarUrl: profile.avatarUrl });
    if (
      user.status === UserStatus.Pending &&
      email &&
      this.auth.adminEmails.includes(email)
    ) {
      await this.users.update(user.id, {
        status: UserStatus.Active,
        role: UserRole.Admin,
      });
    }
    return {
      user: (await this.users.findOneBy({ id: user.id }))!,
      linked: false,
    };
  }

  // Các cách đăng nhập của tài khoản (trang Hồ sơ > Bảo mật)
  async loginMethods(user: User) {
    const full = await this.users.findOneOrFail({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        googleId: true,
        microsoftId: true,
        githubId: true,
        passwordHash: true,
        totpEnabled: true,
      },
    });
    return {
      email: full.email,
      password: !!full.passwordHash,
      totpEnabled: full.totpEnabled,
      linked: Object.fromEntries(
        OAUTH_PROVIDERS.map((p) => [p, !!full[PROVIDER_COLUMN[p]]]),
      ) as Record<OAuthProvider, boolean>,
      available: this.providers(),
    };
  }

  async unlink(user: User, provider: OAuthProvider) {
    const methods = await this.loginMethods(user);
    const remaining =
      Number(methods.password) +
      OAUTH_PROVIDERS.filter((p) => p !== provider && methods.linked[p]).length;
    if (!remaining)
      throw new BadRequestException(
        'Cần giữ ít nhất một cách đăng nhập. Hãy đặt mật khẩu trước khi huỷ liên kết.',
      );
    await this.users.update(user.id, { [PROVIDER_COLUMN[provider]]: null });
    return this.loginMethods(user);
  }

  // ---------- Xác thực 2 lớp (TOTP) ----------

  async setupTotp(user: User) {
    const secret = authenticator.generateSecret();
    await this.users.update(user.id, {
      totpSecret: secret,
      totpEnabled: false,
    });
    const otpauthUrl = authenticator.keyuri(user.email, '4SigmaBrains', secret);
    return {
      secret,
      otpauthUrl,
      qrDataUrl: await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 }),
    };
  }

  private async totpSecret(user: User) {
    const full = await this.users.findOneOrFail({
      where: { id: user.id },
      select: { id: true, totpSecret: true },
    });
    return full.totpSecret;
  }

  async enableTotp(user: User, code: string) {
    const secret = await this.totpSecret(user);
    if (!secret || !authenticator.check(code, secret))
      throw new BadRequestException('Mã xác thực không đúng');
    await this.users.update(user.id, { totpEnabled: true });
  }

  async disableTotp(user: User, code: string) {
    const secret = await this.totpSecret(user);
    if (!secret || !authenticator.check(code, secret))
      throw new BadRequestException('Mã xác thực không đúng');
    await this.users.update(user.id, { totpEnabled: false, totpSecret: null });
  }

  // ---------- Mời thành viên / khách hàng ----------

  // Tạo sẵn tài khoản đã duyệt và gửi link đặt mật khẩu (hiệu lực 7 ngày).
  // Người được mời cũng có thể đăng nhập bằng Google/Microsoft cùng email.
  async invite(actor: User, dto: InviteMemberDto) {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role ?? UserRole.Member;
    if (role === UserRole.Client && !dto.clientId)
      throw new BadRequestException('Mời khách hàng cần chọn khách hàng');
    if (role !== UserRole.Client) this.assertDomain(email);
    let user = await this.users.findOneBy({ email });
    if (user && user.status !== UserStatus.Pending)
      throw new ConflictException('Email này đã có tài khoản');
    const data = {
      email,
      name: dto.name.trim(),
      role,
      title: dto.title ?? null,
      clientId: role === UserRole.Client ? (dto.clientId ?? null) : null,
      status: UserStatus.Active,
    };
    user = user
      ? await this.users.save(Object.assign(user, data))
      : await this.users.save(this.users.create(data));
    for (const projectId of dto.projectIds ?? [])
      await this.projects.addMembers(
        actor,
        projectId,
        { userIds: [user.id] },
        true,
      );

    const link = await this.passwordLink(user, 7 * 24 * 3600);
    const isClient = role === UserRole.Client;
    if (this.mail.enabled) {
      this.mail.send(
        email,
        `${actor.name} mời bạn vào 4SigmaBrains`,
        isClient
          ? 'Bạn được mời theo dõi tiến độ dự án trên cổng khách hàng 4SigmaBrains. Bấm nút bên dưới để đặt mật khẩu (link có hiệu lực 7 ngày).'
          : 'Bạn được mời vào không gian làm việc 4SigmaBrains. Bấm nút bên dưới để đặt mật khẩu, hoặc đăng nhập bằng Google với email này.',
        link,
        'Đặt mật khẩu và vào hệ thống',
      );
    }
    // Không có SMTP thì trả link để quản trị viên tự gửi
    return {
      user,
      inviteLink: this.mail.enabled ? null : `${this.webUrl}${link}`,
    };
  }

  randomToken() {
    return randomBytes(24).toString('base64url');
  }
}
