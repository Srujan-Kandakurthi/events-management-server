import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { ConsoleNotificationProvider } from './providers/console.provider';
import { NOTIFICATION_PROVIDER } from './interfaces/notification-provider.interface';

@Module({
  providers: [
    NotificationsService,
    NodemailerProvider,
    ConsoleNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      inject: [ConfigService, NodemailerProvider, ConsoleNotificationProvider],
      useFactory: (
        config: ConfigService,
        nodemailer: NodemailerProvider,
        consoleProvider: ConsoleNotificationProvider,
      ) => {
        const host = config.get<string>('SMTP_HOST');
        const user = config.get<string>('SMTP_USER');
        // Use real SMTP when configured; otherwise log (local/dev)
        if (host && user) {
          return nodemailer;
        }
        return consoleProvider;
      },
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
