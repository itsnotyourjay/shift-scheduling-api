import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @Post(':shiftId/clock-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clock in for a shift (staff only)' })
  @ApiResponse({ status: 200, description: 'Clocked in — returns attendance log' })
  @ApiResponse({ status: 403, description: 'Not assigned to this shift, or not staff role' })
  @ApiResponse({ status: 409, description: 'Already clocked in' })
  clockIn(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.attendanceService.clockIn(shiftId, currentUser);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF)
  @Post(':shiftId/clock-out')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clock out of a shift (staff only)' })
  @ApiResponse({ status: 200, description: 'Clocked out — returns updated log' })
  @ApiResponse({ status: 400, description: 'Have not clocked in yet' })
  @ApiResponse({ status: 409, description: 'Already clocked out' })
  clockOut(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.attendanceService.clockOut(shiftId, currentUser);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  @Get(':shiftId')
  @ApiOperation({ summary: 'Get all attendance logs for a shift (manager only)' })
  @ApiResponse({ status: 200, description: 'Array of attendance logs' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  findByShift(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.attendanceService.findByShift(shiftId);
  }
}
