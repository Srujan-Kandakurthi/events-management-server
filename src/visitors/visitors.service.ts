import { ConflictException, Injectable } from '@nestjs/common';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorRepository } from './visitors.repository';

@Injectable()
export class VisitorsService {
  constructor(private readonly visitorRepository: VisitorRepository) {}
  
  async createVisitor(
    visitor: CreateVisitorDto,
    ipAddress: string,
    userAgent: string,
    deviceType: string,
  ) {
    let normalizedPhone = visitor.phone.replace(/\D/g, '');
    if (normalizedPhone.length > 10) {
      normalizedPhone = normalizedPhone.slice(-10);
    }
    const e164Phone = '+91' + normalizedPhone;

    const limitDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingVisitor = await this.visitorRepository.findRecentByPhone(
      e164Phone,
      limitDate,
    );

    if (existingVisitor) {
      throw new ConflictException(
        'We have already received an inquiry from this phone number recently. Our team will contact you soon. Please try again tomorrow if needed!',
      );
    }

    const data = await this.visitorRepository.createVisitor({
      ...visitor,
      phone: e164Phone,
      ipAddress,
      userAgent,
      deviceType,
    } as any);
    
    return data;
  }
}
