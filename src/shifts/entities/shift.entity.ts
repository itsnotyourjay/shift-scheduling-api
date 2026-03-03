import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// this is the main shifts table — managers create these, staff get assigned to them
@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  // storing as 'date' type so we can query by specific day easily
  @Column({ type: 'date' })
  date: string;

  // storing times as HH:mm strings — simpler than full timestamps for scheduling
  @Column()
  startTime: string;

  @Column()
  endTime: string;

  // location is optional — some shifts might not have a specific spot
  @Column({ nullable: true })
  location: string;

  // which manager created this shift — FK to users table
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  // which staff members are assigned to this shift
  // this creates the shift_assignments join table automatically
  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'shift_assignments',
    joinColumn: { name: 'shiftId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'staffId', referencedColumnName: 'id' },
  })
  assignedStaff: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
