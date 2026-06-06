import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VisitorDocument = HydratedDocument<Visitor>;

@Schema({ timestamps: true })
export class Visitor {
  @Prop({ required: true })
  fullName: string;

  @Prop()
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  location: string;

  @Prop()
  venue: string;

  @Prop({ required: true })
  eventDate: Date;

  @Prop()
  vision: string;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  deviceType: string;
}

export const VisitorSchema = SchemaFactory.createForClass(Visitor);
