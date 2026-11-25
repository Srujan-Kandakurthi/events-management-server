import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { OtpPurpose } from './enums/otp-purpose.enum';
import { OtpRepository } from './otp.repository';
import { OtpDocument } from './schema/otp.schema';

export interface CreateOtpParams {
  identifier: string;
  purpose: OtpPurpose;
  ipAddress: string;
  metadata?: Record<string, unknown>;
  subject?: string;
  htmlBody?: (code: string) => string;
}

export interface VerifyOtpParams {
  identifier: string;
  purpose: OtpPurpose;
  code: string;
  ipAddress: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpLength: number;
  private readonly ttlMinutes: number;
  private readonly maxAttempts: number;
  private readonly cooldownSeconds: number;
  private readonly maxPerHour: number;

  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.otpLength = Number(this.configService.get('OTP_LENGTH') ?? 6);
    this.ttlMinutes = Number(this.configService.get('OTP_TTL_MINUTES') ?? 10);
    this.maxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS') ?? 5);
    this.cooldownSeconds = Number(
      this.configService.get('OTP_COOLDOWN_SECONDS') ?? 60,
    );
    this.maxPerHour = Number(this.configService.get('OTP_MAX_PER_HOUR') ?? 5);
  }

  async createAndSend(params: CreateOtpParams): Promise<{ expiresAt: Date }> {
    const identifier = params.identifier.toLowerCase().trim();

    await this.enforceRateLimits(identifier, params.purpose);

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.ttlMinutes * 60 * 1000);

    await this.otpRepository.create({
      identifier,
      purpose: params.purpose,
      codeHash,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
      expiresAt,
    });

    const subject =
      params.subject ?? this.defaultSubject(params.purpose);
    const html =
      params.htmlBody?.(code) ??
      this.defaultHtml(code, params.purpose, this.ttlMinutes);

    await this.notificationsService.sendEmail({
      to: identifier,
      subject,
      html,
      text: `Your verification code is ${code}. It expires in ${this.ttlMinutes} minutes.`,
    });

    this.logger.log(
      `OTP created for ${identifier} purpose=${params.purpose} ip=${params.ipAddress}`,
    );

    return { expiresAt };
  }

  async verify(params: VerifyOtpParams): Promise<{
    metadata?: Record<string, unknown>;
    otpId: string;
  }> {
    const identifier = params.identifier.toLowerCase().trim();
    const otp = await this.otpRepository.findLatestActive(
      identifier,
      params.purpose,
    );

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new HttpException(
        'Maximum OTP attempts exceeded. Request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await bcrypt.compare(params.code, otp.codeHash);

    if (!matches) {
      otp.attempts += 1;
      await this.otpRepository.save(otp);

      if (otp.attempts >= otp.maxAttempts) {
        throw new HttpException(
          'Maximum OTP attempts exceeded. Request a new code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadRequestException('Invalid or expired OTP');
    }

    otp.verifiedAt = new Date();
    await this.otpRepository.save(otp);

    this.logger.log(
      `OTP verified for ${identifier} purpose=${params.purpose} createIp=${otp.ipAddress} verifyIp=${params.ipAddress}`,
    );

    return {
      metadata: otp.metadata,
      otpId: String(otp._id),
    };
  }

  async consume(otpId: string): Promise<void> {
    const otp = await this.otpRepository.findById(otpId);

    if (!otp || otp.consumedAt) {
      return;
    }

    otp.consumedAt = new Date();
    await this.otpRepository.save(otp);
  }

  private async enforceRateLimits(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const latest = await this.otpRepository.findLatestActive(
      identifier,
      purpose,
    );

    if (latest) {
      const createdAt =
        (latest as OtpDocument & { createdAt?: Date }).createdAt ??
        new Date(0);
      const elapsedMs = Date.now() - createdAt.getTime();
      if (elapsedMs < this.cooldownSeconds * 1000) {
        const wait = Math.ceil(
          (this.cooldownSeconds * 1000 - elapsedMs) / 1000,
        );
        throw new HttpException(
          `Please wait ${wait}s before requesting another OTP`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const since = new Date(Date.now() - 60 * 60 * 1000);
    const hourCount = await this.otpRepository.countRecent(
      identifier,
      purpose,
      since,
    );

    if (hourCount >= this.maxPerHour) {
      throw new HttpException(
        'Too many OTP requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private generateCode(): string {
    const max = 10 ** this.otpLength;
    const min = 10 ** (this.otpLength - 1);
    return String(randomInt(min, max));
  }

  private defaultSubject(purpose: OtpPurpose): string {
    switch (purpose) {
      case OtpPurpose.ADMIN_INVITE:
        return 'Activate your Service Edge admin account';
      case OtpPurpose.ADMIN_LOGIN:
        return 'Your Service Edge login code';
      default:
        return 'Your Service Edge verification code';
    }
  }

  private defaultHtml(
    code: string,
    purpose: OtpPurpose,
    ttlMinutes: number,
  ): string {
    const title =
      purpose === OtpPurpose.ADMIN_INVITE
        ? 'Activate your Service Edge admin account'
        : 'Service Edge login verification';

    return `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2>${title}</h2>
        <p>Your one-time code is:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold;">${code}</p>
        <p>This code expires in ${ttlMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `;
  }
}
