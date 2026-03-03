import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceLog, AttendanceStatus } from './entities/attendance-log.entity';
import { Shift } from '../shifts/entities/shift.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceLog)
    private readonly attendanceRepo: Repository<AttendanceLog>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
  ) {}

  async clockIn(shiftId: string, currentUser: { sub: string }): Promise<AttendanceLog> {
    // load the shift with assignedStaff so we can verify assignment
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId },
      relations: ['assignedStaff'],
    });
    if (!shift) throw new NotFoundException('Shift not found');

    // only staff who are assigned to this shift may clock in
    const isAssigned = shift.assignedStaff.some((s) => s.id === currentUser.sub);
    if (!isAssigned) {
      throw new ForbiddenException('You are not assigned to this shift');
    }

    // check for an existing log — the DB unique constraint would also catch this,
    // but we want a clean 409 message rather than a raw DB error
    const existing = await this.attendanceRepo.findOne({
      where: { shiftId, staffId: currentUser.sub },
    });
    if (existing && existing.clockInAt) {
      throw new ConflictException('You have already clocked in for this shift');
    }

    // determine status: if clock-in time <= shift start + 15 minutes → present, else → late
    const now = new Date();
    const status = this.resolveStatus(shift.startTime, now);

    // if an ABSENT log already exists (pre-created by a future seeder/manager), update it
    // otherwise create a fresh one
    const log = existing ?? this.attendanceRepo.create({ shiftId, staffId: currentUser.sub });
    log.clockInAt = now;
    log.status = status;

    return this.attendanceRepo.save(log);
  }

  async clockOut(shiftId: string, currentUser: { sub: string }): Promise<AttendanceLog> {
    const log = await this.attendanceRepo.findOne({
      where: { shiftId, staffId: currentUser.sub },
    });

    if (!log || !log.clockInAt) {
      throw new BadRequestException('You have not clocked in for this shift yet');
    }

    if (log.clockOutAt) {
      throw new ConflictException('You have already clocked out for this shift');
    }

    log.clockOutAt = new Date();
    return this.attendanceRepo.save(log);
  }

  async findByShift(shiftId: string): Promise<AttendanceLog[]> {
    // verify the shift exists first so we return 404 rather than an empty array
    const shiftExists = await this.shiftRepo.existsBy({ id: shiftId });
    if (!shiftExists) throw new NotFoundException('Shift not found');

    return this.attendanceRepo.find({
      where: { shiftId },
      relations: ['staff'],
      order: { createdAt: 'ASC' },
    });
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────

  // "present" if clock-in is within 15 minutes of shift start, "late" otherwise
  private resolveStatus(startTime: string, clockInAt: Date): AttendanceStatus {
    const [hours, minutes] = startTime.split(':').map(Number);
    const shiftStartMinutes = hours * 60 + minutes;
    const clockInMinutes = clockInAt.getHours() * 60 + clockInAt.getMinutes();

    return clockInMinutes <= shiftStartMinutes + 15
      ? AttendanceStatus.PRESENT
      : AttendanceStatus.LATE;
  }
}
