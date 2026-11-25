import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schema/admin.schema';
import { AdminStatus } from './enums/admin.enums';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
  ) {}

  create(data: Partial<Admin>): Promise<AdminDocument> {
    return this.adminModel.create(data);
  }

  findByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).exec();
  }

  countAll(): Promise<number> {
    return this.adminModel.countDocuments().exec();
  }

  async save(doc: AdminDocument): Promise<AdminDocument> {
    return doc.save();
  }

  findActiveByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel
      .findOne({
        email: email.toLowerCase().trim(),
        status: AdminStatus.ACTIVE,
      })
      .exec();
  }
}
