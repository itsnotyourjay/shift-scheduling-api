import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceLog } from './entities/attendance-log.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceLog, Shift])],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
