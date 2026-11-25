import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
  type SendEmailPayload,
} from './interfaces/notification-provider.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_PROVIDER)
    private readonly provider: NotificationProvider,
  ) {}

  sendEmail(payload: SendEmailPayload): Promise<void> {
    return this.provider.sendEmail(payload);
  }
}
