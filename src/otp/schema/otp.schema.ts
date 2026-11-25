import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OtpPurpose } from '../enums/otp-purpose.enum';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  identifier: string;

  @Prop({ required: true, enum: OtpPurpose, index: true })
  purpose: OtpPurpose;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ required: true })
  maxAttempts: number;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  consumedAt?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ identifier: 1, purpose: 1, createdAt: -1 });
