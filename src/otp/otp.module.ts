import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { Otp, OtpSchema } from './schema/otp.schema';
import { OtpRepository } from './otp.repository';
import { OtpService } from './otp.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
    NotificationsModule,
  ],
  providers: [OtpService, OtpRepository],
  exports: [OtpService],
})
export class OtpModule {}
