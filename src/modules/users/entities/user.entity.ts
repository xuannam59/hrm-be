import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from '@/common/enums/user-status.enum';
import { RoleEntity } from '@/modules/roles/entities/role.entity';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';

@Entity('User')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'employee_id', type: 'int', nullable: true, unique: true })
  employeeId: number | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin: Date | null;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @OneToOne(() => EmployeeEntity, (employee) => employee.user)
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
