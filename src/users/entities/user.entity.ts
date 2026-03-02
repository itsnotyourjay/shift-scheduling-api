import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  MANAGER = 'manager',
  STAFF = 'staff',
}

// this maps to the 'users' table in postgres
@Entity('users')
export class User {
  // uuid is better than auto-increment numbers because it's harder to guess
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // two people can't register with the same email
  @Column({ unique: true })
  email: string;

  // select: false means password will never accidentally show up in responses
  // you have to explicitly ask for it (we do this in findByEmail for login)
  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  // typeorm handles these automatically, no need to set them manually
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
