import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Shift } from '../shifts/entities/shift.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { AttendanceLog, AttendanceStatus } from '../attendance/entities/attendance-log.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AttendanceLog)
    private readonly attendanceRepo: Repository<AttendanceLog>,
  ) {}

  async getManagerDashboard() {
    const totalShifts = await this.shiftRepo.count();
    const totalStaff = await this.userRepo.countBy({ role: UserRole.STAFF });

    // count all (shift, staff) assignment pairs using the ManyToMany join table
    const raw = await this.shiftRepo
      .createQueryBuilder('shift')
      .select('COUNT(*)', 'totalAssignments')
      .innerJoin('shift.assignedStaff', 'staff')
      .getRawOne<{ totalAssignments: string }>();

    const assignments = parseInt(raw?.totalAssignments ?? '0', 10);

    // count logs where staff actually clocked in (present or late)
    const attended = await this.attendanceRepo.countBy({
      clockInAt: Not(IsNull()),
    });

    const lateArrivals = await this.attendanceRepo.countBy({
      status: AttendanceStatus.LATE,
    });

    // attendance rate = clocked-in logs / total assignments * 100
    const attendanceRate =
      assignments > 0 ? Math.round((attended / assignments) * 1000) / 10 : 0;

    return {
      totalShifts,
      totalStaff,
      totalAssignments: assignments,
      attendanceRate,  // e.g. 75.0 means 75%
      lateArrivals,
    };
  }

  async getStaffDashboard(userId: string) {
    // count shifts this staff member is assigned to
    const totalShiftsAssigned = await this.shiftRepo
      .createQueryBuilder('shift')
      .innerJoin('shift.assignedStaff', 'staff', 'staff.id = :userId', { userId })
      .getCount();

    const attended = await this.attendanceRepo.countBy({
      staffId: userId,
      clockInAt: Not(IsNull()),
    });

    const late = await this.attendanceRepo.countBy({
      staffId: userId,
      status: AttendanceStatus.LATE,
    });

    // absent = assigned but never clocked in
    const absent = totalShiftsAssigned - attended;

    return {
      totalShiftsAssigned,
      attended,
      late,
      absent,
    };
  }
}
