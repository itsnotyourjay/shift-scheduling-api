import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Smith' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  // optional — defaults to 'staff' in the service if not provided
  // needed so we can create manager accounts for testing
  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STAFF })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

