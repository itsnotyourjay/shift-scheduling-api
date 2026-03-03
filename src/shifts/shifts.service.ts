import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // managers see all shifts, staff only see shifts they're assigned to
  async findAll(currentUser: { sub: string; role: UserRole }): Promise<Shift[]> {
    if (currentUser.role === UserRole.MANAGER) {
      return this.shiftRepository.find();
    }

    // for staff: only return shifts where they are in assignedStaff
    return this.shiftRepository
      .createQueryBuilder('shift')
      .innerJoin('shift.assignedStaff', 'staff', 'staff.id = :staffId', {
        staffId: currentUser.sub,
      })
      .leftJoinAndSelect('shift.assignedStaff', 'allStaff')
      .leftJoinAndSelect('shift.createdBy', 'createdBy')
      .getMany();
  }

  async create(
    dto: CreateShiftDto,
    currentUser: { sub: string; role: UserRole },
  ): Promise<Shift> {
    const shift = this.shiftRepository.create({
      ...dto,
      createdById: currentUser.sub,
    });

    // TypeORM eager loads createdBy, but we set createdById for the FK
    return this.shiftRepository.save(shift);
  }

  async findOne(
    id: string,
    currentUser: { sub: string; role: UserRole },
  ): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');

    // staff can only view shifts they are assigned to
    if (currentUser.role === UserRole.STAFF) {
      const isAssigned = shift.assignedStaff?.some(
        (s) => s.id === currentUser.sub,
      );
      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned to this shift');
      }
    }

    return shift;
  }

  async update(id: string, dto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');

    Object.assign(shift, dto);
    return this.shiftRepository.save(shift);
  }

  async remove(id: string): Promise<void> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');

    await this.shiftRepository.remove(shift);
  }

  async assign(shiftId: string, dto: AssignShiftDto): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id: shiftId },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    const staff = await this.userRepository.findOne({
      where: { id: dto.staffId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    // check if this staff member is already assigned to this shift
    const alreadyAssigned = shift.assignedStaff?.some(
      (s) => s.id === staff.id,
    );
    if (alreadyAssigned) {
      throw new ConflictException('Staff member is already assigned to this shift');
    }

    // overlap detection: find all shifts this staff member is assigned to on the same date
    // then check if the new shift's time clashes with any of them
    const existingShifts = await this.shiftRepository
      .createQueryBuilder('shift')
      .innerJoin('shift.assignedStaff', 'staff', 'staff.id = :staffId', {
        staffId: dto.staffId,
      })
      .where('shift.date = :date', { date: shift.date })
      .andWhere('shift.id != :shiftId', { shiftId })
      .getMany();

    for (const existing of existingShifts) {
      // two shifts overlap when: newStart < existingEnd AND newEnd > existingStart
      const newStart = shift.startTime;
      const newEnd = shift.endTime;
      const existStart = existing.startTime;
      const existEnd = existing.endTime;

      if (newStart < existEnd && newEnd > existStart) {
        throw new ConflictException(
          `Shift overlaps with existing shift "${existing.title}" (${existStart}–${existEnd}) on ${shift.date}`,
        );
      }
    }

    // all checks passed — add staff to the assignedStaff list
    shift.assignedStaff = [...(shift.assignedStaff ?? []), staff];
    return this.shiftRepository.save(shift);
  }

  async unassign(shiftId: string, userId: string): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id: shiftId },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    const wasAssigned = shift.assignedStaff?.some((s) => s.id === userId);
    if (!wasAssigned) {
      throw new NotFoundException('Staff member is not assigned to this shift');
    }

    shift.assignedStaff = shift.assignedStaff.filter((s) => s.id !== userId);
    return this.shiftRepository.save(shift);
  }
}
