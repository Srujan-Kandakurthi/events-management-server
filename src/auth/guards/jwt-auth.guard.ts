import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AdminsService } from '../../admins/admins.service';
import { AdminStatus } from '../../admins/enums/admin.enums';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminsService: AdminsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtPayload }
    >();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization');
    }

    const token = header.slice(7);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      const admin = await this.adminsService.findById(payload.sub);
      if (!admin || admin.status !== AdminStatus.ACTIVE) {
        throw new UnauthorizedException('Account is not active');
      }

      request.user = {
        sub: String(admin._id),
        email: admin.email,
        role: admin.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
