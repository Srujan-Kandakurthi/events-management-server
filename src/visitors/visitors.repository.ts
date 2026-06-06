import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Visitor } from './schema/visitor.schema';
import { Model } from 'mongoose';

@Injectable()
export class VisitorRepository {
  constructor(
    @InjectModel(Visitor.name) private readonly visitorModel: Model<Visitor>,
  ) {
    this.visitorModel = visitorModel;
  }
  async createVisitor(visitor: Partial<Visitor>) {
    const newVisitor = await this.visitorModel.create(visitor);
    return newVisitor;
  }

  async findRecentByPhone(phone: string, limitDate: Date) {
    return this.visitorModel.findOne({
      phone,
      createdAt: { $gte: limitDate },
    });
  }
}