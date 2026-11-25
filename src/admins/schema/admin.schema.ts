import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AdminRole, AdminStatus } from '../enums/admin.enums';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;

  @Prop({
    required: true,
    enum: AdminStatus,
    default: AdminStatus.INVITED,
  })
  status: AdminStatus;

  @Prop({ type: Types.ObjectId, ref: Admin.name })
  invitedBy?: Types.ObjectId;

  @Prop()
  invitedAt?: Date;

  @Prop()
  activatedAt?: Date;

  @Prop()
  lastLoginAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
