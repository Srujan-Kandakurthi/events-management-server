import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { OtpPurpose } from '../enums/otp-purpose.enum';

export class CreateOtpDto {
  @IsString()
  identifier: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class VerifyOtpDto {
  @IsString()
  identifier: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @IsString()
  @Length(4, 8)
  code: string;
}

/** Re-export for email-based callers */
export class EmailIdentifierDto {
  @IsEmail()
  email: string;
}
