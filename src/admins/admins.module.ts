import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { Admin, AdminSchema } from './schema/admin.schema';
import { AdminRepository } from './admins.repository';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    OtpModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminsController],
  providers: [AdminsService, AdminRepository],
  exports: [AdminsService],
})
export class AdminsModule {}
