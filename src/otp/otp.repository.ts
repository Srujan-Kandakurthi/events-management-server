import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './schema/otp.schema';
import { OtpPurpose } from './enums/otp-purpose.enum';

@Injectable()
export class OtpRepository {
  constructor(@InjectModel(Otp.name) private readonly otpModel: Model<Otp>) {}

  create(data: Partial<Otp>): Promise<OtpDocument> {
    return this.otpModel.create(data);
  }

  findLatestActive(
    identifier: string,
    purpose: OtpPurpose,
  ): Promise<OtpDocument | null> {
    return this.otpModel
      .findOne({
        identifier,
        purpose,
        consumedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  countRecent(
    identifier: string,
    purpose: OtpPurpose,
    since: Date,
  ): Promise<number> {
    return this.otpModel.countDocuments({
      identifier,
      purpose,
      createdAt: { $gte: since },
    });
  }

  findById(id: string): Promise<OtpDocument | null> {
    return this.otpModel.findById(id).exec();
  }

  async save(doc: OtpDocument): Promise<OtpDocument> {
    return doc.save();
  }
}
