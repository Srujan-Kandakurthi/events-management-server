import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { AdminRole } from '../enums/admin.enums';

export class InviteAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}

export class ActivateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 8)
  otp: string;
}

export class ResendInviteOtpDto {
  @IsEmail()
  email: string;
}
