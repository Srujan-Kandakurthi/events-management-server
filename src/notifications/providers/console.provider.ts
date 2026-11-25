import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  SendEmailPayload,
} from '../interfaces/notification-provider.interface';

/** Dev/fallback provider — logs instead of sending. Swap via module binding. */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    this.logger.warn(
      `[DEV EMAIL] to=${payload.to} subject=${payload.subject}\n${payload.text ?? payload.html}`,
    );
  }
}
