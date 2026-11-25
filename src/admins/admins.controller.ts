import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { getClientIp } from '../common/utils/request-meta';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AdminsService } from './admins.service';
import {
  ActivateAdminDto,
  InviteAdminDto,
  ResendInviteOtpDto,
} from './dto/admin.dto';
import { AdminRole } from './enums/admin.enums';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  /**
   * Create/invite a new admin. First admin in the system can be created
   * without auth; later invites require SUPER_ADMIN.
   */
  @Post('invite')
  async invite(
    @Body() dto: InviteAdminDto,
    @Req() req: Request,
  ) {
    const ipAddress = getClientIp(req);
    const adminCount = await this.adminsService.countAll();

    if (adminCount > 0) {
      throw new UnauthorizedException(
        'Authentication required. Use POST /admins/invite-secure as SUPER_ADMIN.',
      );
    }

    return this.adminsService.invite(dto, ipAddress);
  }

  @Post('invite-secure')
  @UseGuards(JwtAuthGuard)
  async inviteSecure(
    @Body() dto: InviteAdminDto,
    @Req() req: Request,
    @CurrentAdmin() current: JwtPayload,
  ) {
    if (current.role !== AdminRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only SUPER_ADMIN can invite admins');
    }

    return this.adminsService.invite(dto, getClientIp(req), current.sub);
  }

  @Post('activate')
  async activate(@Body() dto: ActivateAdminDto, @Req() req: Request) {
    return this.adminsService.activate(dto, getClientIp(req));
  }

  @Post('resend-invite-otp')
  async resendInviteOtp(
    @Body() dto: ResendInviteOtpDto,
    @Req() req: Request,
  ) {
    return this.adminsService.resendInviteOtp(dto.email, getClientIp(req));
  }
}
