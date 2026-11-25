export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationProvider {
  sendEmail(payload: SendEmailPayload): Promise<void>;
}
