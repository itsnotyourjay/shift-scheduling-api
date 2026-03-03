import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from '../shifts/entities/shift.entity';
import { User } from '../users/entities/user.entity';
import { AttendanceLog } from '../attendance/entities/attendance-log.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, User, AttendanceLog])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
