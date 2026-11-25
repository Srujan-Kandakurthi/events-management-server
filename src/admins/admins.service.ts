import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enums/otp-purpose.enum';
import { AdminRepository } from './admins.repository';
import { InviteAdminDto, ActivateAdminDto } from './dto/admin.dto';
import { AdminRole, AdminStatus } from './enums/admin.enums';
import { AdminDocument } from './schema/admin.schema';

@Injectable()
export class AdminsService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {}

  fullName(admin: Pick<AdminDocument, 'firstName' | 'lastName'>): string {
    return `${admin.firstName} ${admin.lastName}`.trim();
  }

  async invite(
    dto: InviteAdminDto,
    ipAddress: string,
    invitedBy?: string,
  ): Promise<{ message: string; email: string; expiresAt: Date }> {
    const email = dto.email.toLowerCase().trim();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const existing = await this.adminRepository.findByEmail(email);

    if (existing && existing.status !== AdminStatus.INVITED) {
      throw new ConflictException('An admin with this email already exists');
    }

    let admin: AdminDocument;

    if (existing) {
      admin = existing;
      admin.firstName = firstName;
      admin.lastName = lastName;
      if (dto.role) {
        admin.role = dto.role;
      }
      admin.invitedAt = new Date();
      await this.adminRepository.save(admin);
    } else {
      const adminCount = await this.adminRepository.countAll();
      const role =
        dto.role ??
        (adminCount === 0 ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN);

      admin = await this.adminRepository.create({
        email,
        firstName,
        lastName,
        role,
        status: AdminStatus.INVITED,
        invitedBy: invitedBy
          ? new Types.ObjectId(invitedBy)
          : undefined,
        invitedAt: new Date(),
      });
    }

    const adminPanelUrl =
      this.configService.get<string>('ADMIN_PANEL_URL') ??
      'http://localhost:8081';
    const displayName = this.fullName(admin);

    const { expiresAt } = await this.otpService.createAndSend({
      identifier: email,
      purpose: OtpPurpose.ADMIN_INVITE,
      ipAddress,
      metadata: { adminId: String(admin._id) },
      subject: 'Activate your Service Edge admin account',
      htmlBody: (code) => `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2>Welcome to Service Edge, ${displayName}</h2>
          <p>You have been invited as an admin. Use this code to activate your account:</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold;">${code}</p>
          <p>
            Or open the app and enter the code:
            <a href="${adminPanelUrl}/activate">${adminPanelUrl}/activate</a>
          </p>
          <p>After activation, you can sign in with a one-time email code. Sessions last 7 days.</p>
        </div>
      `,
    });

    return {
      message: 'Invite sent. Ask the admin to verify the OTP to activate.',
      email,
      expiresAt,
    };
  }

  async activate(
    dto: ActivateAdminDto,
    ipAddress: string,
  ): Promise<{
    message: string;
    admin: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: AdminRole;
    };
  }> {
    const email = dto.email.toLowerCase().trim();
    const admin = await this.adminRepository.findByEmail(email);

    if (!admin) {
      throw new NotFoundException('Invite not found');
    }

    if (admin.status === AdminStatus.DISABLED) {
      throw new BadRequestException('This admin account is disabled');
    }

    if (admin.status === AdminStatus.ACTIVE) {
      throw new BadRequestException('Account is already active. Please login.');
    }

    const { otpId } = await this.otpService.verify({
      identifier: email,
      purpose: OtpPurpose.ADMIN_INVITE,
      code: dto.otp,
      ipAddress,
    });

    admin.status = AdminStatus.ACTIVE;
    admin.activatedAt = new Date();
    await this.adminRepository.save(admin);
    await this.otpService.consume(otpId);

    return {
      message: 'Account activated. You can now login with OTP.',
      admin: {
        id: String(admin._id),
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }

  async resendInviteOtp(
    email: string,
    ipAddress: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    const admin = await this.adminRepository.findByEmail(email);

    if (!admin || admin.status !== AdminStatus.INVITED) {
      throw new BadRequestException(
        'Unable to resend invite for this email',
      );
    }

    const result = await this.invite(
      {
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
      ipAddress,
    );

    return { message: 'Invite OTP resent', expiresAt: result.expiresAt };
  }

  async getActiveByEmail(email: string): Promise<AdminDocument> {
    const admin = await this.adminRepository.findActiveByEmail(email);
    if (!admin) {
      throw new BadRequestException('Invalid credentials');
    }
    return admin;
  }

  async markLogin(admin: AdminDocument): Promise<void> {
    admin.lastLoginAt = new Date();
    await this.adminRepository.save(admin);
  }

  async findById(id: string): Promise<AdminDocument | null> {
    return this.adminRepository.findById(id);
  }

  async countAll(): Promise<number> {
    return this.adminRepository.countAll();
  }
}
