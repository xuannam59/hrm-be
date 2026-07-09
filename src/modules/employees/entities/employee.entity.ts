import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EEmployeeStatus, EGenderType } from '@/common/types/employee.type';
import { DepartmentEntity } from '@/modules/departments/entities/department.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { BaseEntity } from '@/common/bases/entity.base';
import { AttendanceEntity } from '@/modules/attendance/entities/attendance.entity';
import { EmploymentHistoryEntity } from '../../employee-histories/entities/employment-history.entity';
import { LeaveRequestEntity } from '@/modules/leave-requests/entities/leave-request.entity';
import { EmployeeEducationEntity } from '@/modules/employee-educations/entities/employee-education.entity';
import { EmployeeBenefitEntity } from '@/modules/employee-benefit/entities/employee-benefit.entity';
import { EmployeeInsuranceEntity } from '@/modules/employee-insurance/entities/employee-insurance.entity';
import { PayrollEntity } from '@/modules/payrolls/entities/payroll.entity';

@Entity('Employee')
export class EmployeeEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'enum', enum: EGenderType })
  gender: EGenderType;

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
    enum: EEmployeeStatus,
    default: EEmployeeStatus.WORKING,
  })
  status: EEmployeeStatus;

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

  @OneToMany(() => EmployeeEducationEntity, (education) => education.employee)
  educations: EmployeeEducationEntity[];

  @OneToMany(() => EmployeeInsuranceEntity, (insurance) => insurance.employee)
  insurances: EmployeeInsuranceEntity[];

  @OneToMany(() => EmployeeBenefitEntity, (benefit) => benefit.employee)
  benefits: EmployeeBenefitEntity[];

  @OneToMany(() => PayrollEntity, (payroll) => payroll.employee)
  payrolls: PayrollEntity[];
}
