import { Body, Controller, Post, Req } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import type { Request } from 'express';

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  async createVisitor(@Body() visitor: CreateVisitorDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    let deviceType = 'Desktop';
    if (/ipad/i.test(userAgent)) {
      deviceType = 'iPad';
    } else if (
      /tablet/i.test(userAgent) ||
      (/android/i.test(userAgent) && !/mobile/i.test(userAgent))
    ) {
      deviceType = 'Tablet';
    } else if (/mobile|iphone|android/i.test(userAgent)) {
      deviceType = 'Mobile';
    }

    const data = await this.visitorsService.createVisitor(
      visitor,
      ipAddress,
      userAgent,
      deviceType,
    );
    return {
      message: 'New Visitor Has Been Added',
      data,
    };
  }
}
