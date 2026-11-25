import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  NotificationProvider,
  SendEmailPayload,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class NodemailerProvider implements NotificationProvider {
  private readonly logger = new Logger(NodemailerProvider.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const appName = this.configService.get<string>('APP_NAME') ?? 'Service Edge';
    const configuredFrom = this.configService.get<string>('SMTP_FROM');

    if (configuredFrom) {
      this.from = configuredFrom;
    } else if (user) {
      this.from = `${appName} <${user}>`;
    } else {
      this.from = `${appName} <noreply@localhost>`;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    this.logger.log(`Email sent to ${payload.to}`);
  }
}
