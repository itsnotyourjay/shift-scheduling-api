import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Staff clocks in for a shift
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @Post(':shiftId/clock-in')
  @HttpCode(200)
  clockIn(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.attendanceService.clockIn(shiftId, currentUser);
  }

  // Staff clocks out of a shift
  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @Post(':shiftId/clock-out')
  @HttpCode(200)
  clockOut(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.attendanceService.clockOut(shiftId, currentUser);
  }

  // Manager views all attendance logs for a shift
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @Get(':shiftId')
  findByShift(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.attendanceService.findByShift(shiftId);
  }
}
