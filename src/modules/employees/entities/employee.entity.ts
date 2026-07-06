import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import { EmployeeStatus, GenderType } from '@/common/types/employee.type';
import { DepartmentEntity } from '@/modules/departments/entities/department.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { EntityBase } from '@/common/bases/entity.base';
import { AttendanceEntity } from '@/modules/attendance/entities/attendance.entity';
import { EmploymentHistoryEntity } from '../../employee-histories/entities/employment-history.entity';
import { LeaveRequestEntity } from '@/modules/leave-requests/entities/leave-request.entity';

@Entity('Employee')
export class EmployeeEntity extends EntityBase {
  @Column({ unique: true })
  employeeCode: string;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'enum', enum: GenderType })
  gender: GenderType;

  @Column({ type: 'datetime', nullable: true })
  birthday: Date | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ type: 'datetime' })
  hireDate: Date;

  @Column()
  position: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.WORKING,
  })
  status: EmployeeStatus;

  @Column({ name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => DepartmentEntity, (department) => department.employees)
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity;

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.employee)
  attendances: AttendanceEntity[];

  @OneToMany(
    () => EmploymentHistoryEntity,
    (employmentHistory) => employmentHistory.employee,
  )
  employmentHistories: EmploymentHistoryEntity[];

  @OneToOne(() => UserEntity, (user) => user.employee)
  user: UserEntity;

  @OneToOne(() => DepartmentEntity, (department) => department.manager)
  managedDepartment: DepartmentEntity | null;

  @OneToMany(() => LeaveRequestEntity, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequestEntity[];
}
