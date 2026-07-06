import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UserStatus } from '@/common/types/user.type';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { EntityBase } from '@/common/bases/entity.base';
import { Role } from '@/common/constants/role.constant';

@Entity('User')
export class UserEntity extends EntityBase {
  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'role', type: 'enum', enum: Role })
  role: Role;

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

  @OneToOne(() => EmployeeEntity, (employee) => employee.user, {
    nullable: true,
  })
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;
}
