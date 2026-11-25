import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminsService } from '../admins/admins.service';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enums/otp-purpose.enum';
import { AdminRole } from '../admins/enums/admin.enums';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly sessionDays: number;

  constructor(
    private readonly adminsService: AdminsService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.sessionDays = Number(
      this.configService.get('JWT_EXPIRES_DAYS') ?? 7,
    );
  }

  async requestLoginOtp(
    email: string,
    ipAddress: string,
  ): Promise<{ message: string; expiresAt?: Date }> {
    const generic = {
      message: 'If this email is registered, an OTP has been sent.',
    };

    try {
      const admin = await this.adminsService.getActiveByEmail(email);
      const displayName = this.adminsService.fullName(admin);

      const { expiresAt } = await this.otpService.createAndSend({
        identifier: admin.email,
        purpose: OtpPurpose.ADMIN_LOGIN,
        ipAddress,
        metadata: { adminId: String(admin._id) },
        subject: 'Your Service Edge login code',
        htmlBody: (code) => `
          <div style="font-family: sans-serif; max-width: 480px;">
            <h2>Service Edge login code</h2>
            <p>Hi ${displayName}, use this code to sign in:</p>
            <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold;">${code}</p>
            <p>After verifying, you will stay signed in for ${this.sessionDays} days.</p>
          </div>
        `,
      });

      return { ...generic, expiresAt };
    } catch {
      return generic;
    }
  }

  async verifyLoginOtp(
    email: string,
    otp: string,
    ipAddress: string,
  ): Promise<{
    accessToken: string;
    expiresIn: string;
    admin: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: AdminRole;
    };
  }> {
    const admin = await this.adminsService.getActiveByEmail(email);

    const { otpId } = await this.otpService.verify({
      identifier: admin.email,
      purpose: OtpPurpose.ADMIN_LOGIN,
      code: otp,
      ipAddress,
    });

    await this.otpService.consume(otpId);
    await this.adminsService.markLogin(admin);

    const payload: JwtPayload = {
      sub: String(admin._id),
      email: admin.email,
      role: admin.role,
    };

    const expiresInSeconds = this.sessionDays * 24 * 60 * 60;
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: expiresInSeconds,
    });

    return {
      accessToken,
      expiresIn: `${this.sessionDays}d`,
      admin: {
        id: String(admin._id),
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }
}
