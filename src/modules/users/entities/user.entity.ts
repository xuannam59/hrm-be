import { BaseEntity } from '@/common/bases/entity.base';
import { ERole, EUserStatus } from '@/common/constants/user.constant';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ name: 'role', type: 'enum', enum: ERole })
  role!: ERole;

  @Column({ name: 'employee_id', type: 'int', unique: true })
  employeeId!: number;

  @Column({
    type: 'enum',
    enum: EUserStatus,
    default: EUserStatus.ACTIVE,
  })
  status!: EUserStatus;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin!: Date | null;

  @OneToOne(() => EmployeeEntity, (employee) => employee.user)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;
}
