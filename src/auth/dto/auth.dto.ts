import { IsEmail, IsString, Length } from 'class-validator';

export class RequestLoginOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyLoginOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 8)
  otp: string;
}
