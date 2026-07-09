import { BaseEntity } from '@/common/bases/entity.base';
import { EPayrollStatus } from '@/common/types/payroll.type';
import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity('Payroll')
@Unique(['employeeId', 'month', 'year'])
export class PayrollEntity extends BaseEntity {
  @Column({ type: 'int', name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'int', name: 'month' })
  month: number;

  @Column({ type: 'int', name: 'year' })
  year: number;

  @Column({ type: 'decimal', name: 'basic_salary', precision: 10, scale: 2 })
  basicSalary: number;

  @Column({ type: 'int', name: 'standard_working_days' })
  standardWorkingDays: number;

  @Column({ type: 'decimal', name: 'work_days', precision: 10, scale: 2 })
  workDays: number;

  @Column({
    type: 'decimal',
    name: 'allowance_amount',
    precision: 10,
    scale: 2,
  })
  allowanceAmount: number;

  @Column({
    type: 'decimal',
    name: 'bonus_amount',
    precision: 10,
    scale: 2,
  })
  bonusAmount: number;

  @Column({
    type: 'decimal',
    name: 'health_insurance_amount',
    precision: 10,
    scale: 2,
  })
  healthInsuranceAmount: number;

  @Column({
    type: 'decimal',
    name: 'social_insurance_amount',
    precision: 10,
    scale: 2,
  })
  socialInsuranceAmount: number;

  @Column({ type: 'decimal', name: 'gross_salary', precision: 10, scale: 2 })
  grossSalary: number;

  @Column({ type: 'decimal', name: 'net_salary', precision: 10, scale: 2 })
  netSalary: number;

  @Column({ type: 'enum', enum: EPayrollStatus })
  status: EPayrollStatus;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.payrolls)
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity;
}
