import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

import type { AppConfig } from '../../config/configuration.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const mail = config.get('mail', { infer: true });
    this.from = mail.from;
    this.webUrl = config.get('webUrl', { infer: true });
    this.transporter = mail.host
      ? nodemailer.createTransport({
          host: mail.host,
          port: mail.port,
          secure: mail.secure,
          auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
        })
      : null;
    if (!this.transporter)
      this.logger.warn(
        'Chưa cấu hình SMTP_HOST: không gửi email, chỉ thông báo trong app',
      );
  }

  get enabled() {
    return this.transporter !== null;
  }

  // Gửi nền, lỗi chỉ ghi log để không làm hỏng thao tác chính.
  send(
    to: string,
    subject: string,
    text: string,
    link?: string | null,
    cta = 'Mở trong ứng dụng',
  ) {
    if (!this.transporter) return;
    const url = link ? `${this.webUrl}${link}` : this.webUrl;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#111a24">
        <div style="font-weight:700;font-size:16px;margin-bottom:16px">
          <span style="background:#1f4fd1;color:#fff;border-radius:6px;padding:4px 8px">4σ</span> 4SigmaBrains
        </div>
        <h2 style="font-size:18px;margin:0 0 8px">${escapeHtml(subject)}</h2>
        <p style="color:#5b6675;white-space:pre-line">${escapeHtml(text)}</p>
        <a href="${url}" style="display:inline-block;margin-top:16px;background:#1f4fd1;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px">${escapeHtml(cta)}</a>
      </div>`;
    this.transporter
      .sendMail({
        from: this.from,
        to,
        subject,
        text: `${text}\n\n${url}`,
        html,
      })
      .catch((e) =>
        this.logger.error(`Gửi email tới ${to} thất bại: ${String(e)}`),
      );
  }
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}
