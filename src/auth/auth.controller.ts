import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { getClientIp } from '../common/utils/request-meta';
import { AuthService } from './auth.service';
import { RequestLoginOtpDto, VerifyLoginOtpDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { AdminsService } from '../admins/admins.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminsService: AdminsService,
  ) {}

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestLoginOtpDto, @Req() req: Request) {
    return this.authService.requestLoginOtp(dto.email, getClientIp(req));
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyLoginOtpDto, @Req() req: Request) {
    return this.authService.verifyLoginOtp(
      dto.email,
      dto.otp,
      getClientIp(req),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentAdmin() current: JwtPayload) {
    const admin = await this.adminsService.findById(current.sub);
    return {
      id: current.sub,
      email: current.email,
      role: current.role,
      firstName: admin?.firstName,
      lastName: admin?.lastName,
    };
  }
}
