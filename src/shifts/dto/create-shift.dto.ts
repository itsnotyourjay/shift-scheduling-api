import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @MinLength(1)
  title: string;

  // expects YYYY-MM-DD format
  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  date: string;

  // strict HH:mm format — so we don't get weird inputs like "9am" or "9:00:00"
  @ApiProperty({ example: '08:00' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '16:00' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: 'Warehouse A' })
  @IsOptional()
  @IsString()
  location?: string;
}
