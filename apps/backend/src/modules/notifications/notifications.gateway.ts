import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import type { AppConfig } from '../../config/configuration.js';
import { SESSION_COOKIE } from '../auth/auth.constants.js';

// Đẩy thông báo thời gian thực. Mỗi người dùng vào phòng riêng "user:<id>".
@WebSocketGateway({
  path: '/socket.io',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = parseCookie(client.handshake.headers.cookie ?? '')[
        SESSION_COOKIE
      ];
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token ?? '', {
        secret: this.config.get('auth.jwtSecret', { infer: true }),
      });
      await client.join(`user:${payload.sub}`);
    } catch {
      this.logger.debug('Từ chối kết nối socket không có phiên hợp lệ');
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server?.to(`user:${userId}`).emit(event, data);
  }
}

function parseCookie(header: string): Record<string, string> {
  return Object.fromEntries(
    header
      .split(';')
      .map((p) => p.trim().split('='))
      .filter(([k, v]) => k && v)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
  );
}
