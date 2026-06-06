import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, MaxLength, MinLength } from 'class-validator';

export class CreateVisitorDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name is too short' })
  @MaxLength(100, { message: 'Full name is too long' })
  fullName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(100, { message: 'Email address is too long' })
  email: string;

  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsPhoneNumber('IN', { message: 'Please provide a valid 10-digit mobile number' })
  phone: string;

  @IsNotEmpty({ message: 'Location is required' })
  @MinLength(2, { message: 'Location name is too short' })
  @MaxLength(100, { message: 'Location name is too long' })
  location: string;

  @IsOptional()
  venue: string;

  @IsNotEmpty({ message: 'Event date is required' })
  eventDate: Date;

  @IsOptional()
  @MinLength(10, { message: 'Vision description must be at least 10 characters' })
  @MaxLength(200, { message: 'Vision description is too long (max 200)' })
  vision: string;
}
