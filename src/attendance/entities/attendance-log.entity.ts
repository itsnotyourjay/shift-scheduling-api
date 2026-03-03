import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Shift } from '../../shifts/entities/shift.entity';
import { User } from '../../users/entities/user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
}

// the unique constraint means one staff member can only have ONE log per shift
// this is what prevents double clock-ins at the DB level
@Unique(['shiftId', 'staffId'])
@Entity('attendance_logs')
export class AttendanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Shift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shiftId' })
  shift: Shift;

  @Column()
  shiftId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staffId' })
  staff: User;

  @Column()
  staffId: string;

  // nullable — set when staff clocks in, null means they haven't yet
  @Column({ type: 'timestamptz', nullable: true })
  clockInAt: Date | null;

  // nullable — set when staff clocks out, null means they haven't yet
  @Column({ type: 'timestamptz', nullable: true })
  clockOutAt: Date | null;

  // calculated at clock-in time based on how late the staff arrived
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @CreateDateColumn()
  createdAt: Date;
}
